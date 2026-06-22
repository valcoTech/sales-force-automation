"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  IncentiveSalesResult,
  IncentiveOutletResult,
} from "@/types/incentive";
import {
  calculateIncentiveSales,
  calculateIncentiveNewPrincipal,
  calculateIncentiveOutlet,
} from "@/lib/incentiveCalculation";
import {
  fetchIncentiveFilters,
  invalidateIncentiveFiltersCache,
  fetchRawDataForPeriod,
  fetchTargetsForPeriod,
  fetchTargetOutletsForPeriod,
  fetchNewPrincipalTargetsForPeriod,
} from "@/lib/fetchIncentiveData";
import ExcelUploader from "@/components/incentive/ExcelUploader";
import IncentiveSalesTable from "@/components/incentive/IncentiveSalesTable";
import IncentiveOutletTable from "@/components/incentive/IncentiveOutletTable";
import IncentiveSummaryCard from "@/components/incentive/IncentiveSummaryCard";
import toast from "react-hot-toast";

type TabKey = "upload" | "report";
type UploadSection = "raw_data" | "target_sales" | "target_new_principal" | "target_outlet";

const DELETE_BATCH_SIZE = 50;

function getRawDataReplacementScopes(rows: { ar_slsm_name: string; bln: string; year: number }[]) {
  const scopeMap = new Map<string, { bln: string; year: number; salesmen: Set<string> }>();

  for (const row of rows) {
    const salesmanName = row.ar_slsm_name.trim();
    const bln = row.bln.trim();
    if (!salesmanName || !bln || !row.year) continue;

    const key = `${bln.toUpperCase()}|${row.year}`;
    const scope = scopeMap.get(key) || {
      bln,
      year: row.year,
      salesmen: new Set<string>(),
    };
    scope.salesmen.add(salesmanName);
    scopeMap.set(key, scope);
  }

  return Array.from(scopeMap.values());
}

export default function SupervisorIncentivePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("upload");
  const [uploadSection, setUploadSection] = useState<UploadSection>("raw_data");
  const [uploading, setUploading] = useState(false);

  // Report state
  const [periods, setPeriods] = useState<{ bln: string; month: string; year: number }[]>([]);
  const [salesmanList, setSalesmanList] = useState<string[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingCalculation, setLoadingCalculation] = useState(false);

  // Filter state
  const [selectedSalesman, setSelectedSalesman] = useState<string>("");
  const [selectedBln, setSelectedBln] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Calculated results
  const [salesResult, setSalesResult] = useState<IncentiveSalesResult | null>(null);
  const [newPrincipalResult, setNewPrincipalResult] = useState<IncentiveSalesResult | null>(null);
  const [outletResult, setOutletResult] = useState<IncentiveOutletResult | null>(null);

  // Load filter options (paginated — avoids Supabase 1000-row default limit)
  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    try {
      const { periods: periodList, salesmen: names } =
        await fetchIncentiveFilters();
      setPeriods(periodList);
      setSalesmanList(names);
    } catch (err) {
      console.error("Failed to load report data:", err);
      toast.error("Gagal memuat data filter report");
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "report") {
      loadReportData();
    }
  }, [activeTab, loadReportData]);

  // Auto-select latest period on first load
  useEffect(() => {
    if (periods.length > 0 && !selectedBln) {
      const latest = periods[periods.length - 1];
      setSelectedBln(latest.bln);
      setSelectedYear(latest.year);
    }
  }, [periods, selectedBln]);

  // Fetch period data & recalculate when filters change
  useEffect(() => {
    if (!selectedSalesman || !selectedBln || !selectedYear) {
      setSalesResult(null);
      setNewPrincipalResult(null);
      setOutletResult(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoadingCalculation(true);
      try {
        const [rawData, targets, targetOutlets, newPrincipalTargets] = await Promise.all([
          fetchRawDataForPeriod(selectedBln, selectedYear),
          fetchTargetsForPeriod(selectedBln, selectedYear),
          fetchTargetOutletsForPeriod(selectedBln, selectedYear),
          fetchNewPrincipalTargetsForPeriod(selectedBln, selectedYear),
        ]);
        if (cancelled) return;

        setSalesResult(
          calculateIncentiveSales(rawData, targets, selectedSalesman, selectedBln, selectedYear)
        );
        setNewPrincipalResult(
          calculateIncentiveNewPrincipal(rawData, newPrincipalTargets, selectedSalesman, selectedBln, selectedYear)
        );
        setOutletResult(
          calculateIncentiveOutlet(rawData, targetOutlets, selectedSalesman, selectedBln, selectedYear)
        );
      } catch (err) {
        console.error("Failed to calculate incentive:", err);
        if (!cancelled) toast.error("Gagal menghitung incentive");
      } finally {
        if (!cancelled) setLoadingCalculation(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedSalesman, selectedBln, selectedYear]);

  // ─── Upload handlers ─────────────────────────────────────────────

  const handleUploadRawData = async (rows: Record<string, unknown>[]) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const mapped = rows.map((r) => ({
        division: String(r["DIVISION"] ?? r["division"] ?? ""),
        ar_date: String(r["AR DATE"] ?? r["ar_date"] ?? r["AR_DATE"] ?? ""),
        cust_ship_id: String(r["CUST_SHIP_ID"] ?? r["cust_ship_id"] ?? ""),
        cust_ship_name: String(r["CUST_SHIP_NAME"] ?? r["cust_ship_name"] ?? ""),
        ar_slsm_name: String(r["AR_SLSM_NAME"] ?? r["ar_slsm_name"] ?? ""),
        principal_id: String(r["PRINCIPAL ID"] ?? r["principal_id"] ?? r["PRINCIPAL_ID"] ?? ""),
        supplier_name: String(r["SUPPLIER_NAME"] ?? r["supplier_name"] ?? ""),
        prod_id: String(r["PROD_ID"] ?? r["prod_id"] ?? ""),
        prod_name: String(r["PROD_NAME"] ?? r["prod_name"] ?? ""),
        prod_uom_id: String(r["PROD_UOM_ID"] ?? r["prod_uom_id"] ?? ""),
        unit_list_price: Number(r["UNIT_LIST_PRICE"] ?? r["unit_list_price"] ?? 0),
        gs_qty: Number(r["GS_QTY"] ?? r["gs_qty"] ?? 0),
        gs_value: Number(r["GS_VALUE"] ?? r["gs_value"] ?? 0),
        bln: String(r["BLN"] ?? r["bln"] ?? ""),
        month: String(r["MONTH"] ?? r["month"] ?? ""),
        year: Number(r["YEAR"] ?? r["year"] ?? 0),
        uploaded_by: userId,
      }));

      const replacementScopes = getRawDataReplacementScopes(mapped);
      for (const scope of replacementScopes) {
        const salesmen = Array.from(scope.salesmen);
        for (let i = 0; i < salesmen.length; i += DELETE_BATCH_SIZE) {
          const batch = salesmen.slice(i, i + DELETE_BATCH_SIZE);
          const { error } = await supabase
            .from("raw_data")
            .delete()
            .eq("bln", scope.bln)
            .eq("year", scope.year)
            .in("ar_slsm_name", batch);
          if (error) throw error;
        }
      }

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        const { error } = await supabase.from("raw_data").insert(batch);
        if (error) throw error;
      }

      toast.success(`${mapped.length} rows raw data berhasil diupload!`);
      await invalidateIncentiveFiltersCache();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Gagal upload raw data");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadTargetSales = async (rows: Record<string, unknown>[]) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const mapped = rows.map((r) => ({
        salesman_name: String(r["SALESMAN_NAME"] ?? r["salesman_name"] ?? r["SALESMAN"] ?? ""),
        principal_group: String(r["PRINCIPAL_GROUP"] ?? r["principal_group"] ?? r["PRINCIPAL"] ?? ""),
        target_value: Number(r["TARGET_VALUE"] ?? r["target_value"] ?? r["TARGET"] ?? 0),
        bln: String(r["BLN"] ?? r["bln"] ?? ""),
        year: Number(r["YEAR"] ?? r["year"] ?? 0),
        uploaded_by: userId,
      }));

      const { error } = await supabase.from("incentive_targets").upsert(mapped, {
        onConflict: "salesman_name,principal_group,bln,year",
      });
      if (error) throw error;

      toast.success(`${mapped.length} target sales berhasil diupload!`);
      await invalidateIncentiveFiltersCache();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Gagal upload target sales");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadTargetNewPrincipal = async (rows: Record<string, unknown>[]) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const mapped = rows.map((r) => ({
        salesman_name: String(r["SALESMAN_NAME"] ?? r["salesman_name"] ?? r["SALESMAN"] ?? ""),
        principal_group: String(r["PRINCIPAL_GROUP"] ?? r["principal_group"] ?? r["PRINCIPAL"] ?? ""),
        target_value: Number(r["TARGET_VALUE"] ?? r["target_value"] ?? r["TARGET"] ?? 0),
        bln: String(r["BLN"] ?? r["bln"] ?? ""),
        year: Number(r["YEAR"] ?? r["year"] ?? 0),
        uploaded_by: userId,
      }));

      const { error } = await supabase.from("incentive_new_principal_targets").upsert(mapped, {
        onConflict: "salesman_name,principal_group,bln,year",
      });
      if (error) throw error;

      toast.success(`${mapped.length} target new principal berhasil diupload!`);
      await invalidateIncentiveFiltersCache();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Gagal upload target new principal");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadTargetOutlet = async (rows: Record<string, unknown>[]) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const mapped = rows.map((r) => ({
        salesman_name: String(r["SALESMAN_NAME"] ?? r["salesman_name"] ?? r["SALESMAN"] ?? ""),
        principal_group: String(r["PRINCIPAL_GROUP"] ?? r["principal_group"] ?? r["PRINCIPAL"] ?? ""),
        target_outlet: Number(r["TARGET_OUTLET"] ?? r["target_outlet"] ?? 0),
        total_outlet: Number(r["TOTAL_OUTLET"] ?? r["total_outlet"] ?? 0),
        bln: String(r["BLN"] ?? r["bln"] ?? ""),
        year: Number(r["YEAR"] ?? r["year"] ?? 0),
        uploaded_by: userId,
      }));

      const { error } = await supabase.from("incentive_target_outlets").upsert(mapped, {
        onConflict: "salesman_name,principal_group,bln,year",
      });
      if (error) throw error;

      toast.success(`${mapped.length} target outlet berhasil diupload!`);
      await invalidateIncentiveFiltersCache();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Gagal upload target outlet");
    } finally {
      setUploading(false);
    }
  };

  // ─── Tab buttons config ───────────────────────────────────────────
  const tabs = [
    { key: "upload" as TabKey, label: "Upload Data", icon: "📤" },
    { key: "report" as TabKey, label: "Report Incentive", icon: "📊" },
  ];

  const uploadSections = [
    { key: "raw_data" as UploadSection, label: "Raw Data", icon: "📋", description: "Upload data penjualan mentah" },
    { key: "target_sales" as UploadSection, label: "Target Sales", icon: "🎯", description: "Upload target per principal per salesman" },
    { key: "target_new_principal" as UploadSection, label: "Target New Principal", icon: "🌟", description: "Upload target new principal" },
    { key: "target_outlet" as UploadSection, label: "Target Outlet", icon: "🏪", description: "Upload target outlet per principal" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Incentive Salesman
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola data dan lihat perhitungan incentive salesman
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          {/* Upload Section Selector */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {uploadSections.map((sec) => (
              <button
                key={sec.key}
                onClick={() => setUploadSection(sec.key)}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-200 border-2 cursor-pointer ${
                  uploadSection === sec.key
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                }`}
              >
                <span className="text-2xl">{sec.icon}</span>
                <span className="text-xs font-bold text-slate-700">{sec.label}</span>
                <span className="text-[10px] text-slate-400">{sec.description}</span>
              </button>
            ))}
          </div>

          {/* Upload Area */}
          {uploadSection === "raw_data" && (
            <ExcelUploader
              label="Upload Raw Data"
              description="File Excel dengan header: DIVISION, AR DATE, CUST_SHIP_ID, CUST_SHIP_NAME, AR_SLSM_NAME, PRINCIPAL ID, SUPPLIER_NAME, PROD_ID, PROD_NAME, PROD_UOM_ID, UNIT_LIST_PRICE, GS_QTY, GS_VALUE, BLN, MONTH, YEAR"
              icon="📋"
              onData={handleUploadRawData}
              loading={uploading}
            />
          )}
          {uploadSection === "target_sales" && (
            <ExcelUploader
              label="Upload Target Sales"
              description="Header: SALESMAN_NAME, PRINCIPAL_GROUP, TARGET_VALUE, BLN, YEAR"
              icon="🎯"
              onData={handleUploadTargetSales}
              loading={uploading}
            />
          )}
          {uploadSection === "target_new_principal" && (
            <ExcelUploader
              label="Upload Target New Principal"
              description="Header: SALESMAN_NAME, PRINCIPAL_GROUP, TARGET_VALUE, BLN, YEAR"
              icon="🌟"
              onData={handleUploadTargetNewPrincipal}
              loading={uploading}
            />
          )}
          {uploadSection === "target_outlet" && (
            <ExcelUploader
              label="Upload Target Outlet"
              description="Header: SALESMAN_NAME, PRINCIPAL_GROUP, TARGET_OUTLET, TOTAL_OUTLET, BLN, YEAR"
              icon="🏪"
              onData={handleUploadTargetOutlet}
              loading={uploading}
            />
          )}

          {/* Info box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex gap-3">
              <span className="text-lg">💡</span>
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-semibold">Tips Upload:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-blue-600">
                  <li>Pastikan header Excel sesuai dengan format yang tertera</li>
                  <li>Data target akan di-upsert (update jika sudah ada, insert jika baru)</li>
                  <li>Raw data akan selalu ditambahkan (append), hapus manual jika perlu replace</li>
                  <li>Format file: .xlsx, .xls, atau .csv</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === "report" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Filter Report
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Salesman
                </label>
                <select
                  value={selectedSalesman}
                  onChange={(e) => setSelectedSalesman(e.target.value)}
                  disabled={loadingReport}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="">
                    {loadingReport ? "Memuat salesman..." : "-- Pilih Salesman --"}
                  </option>
                  {!loadingReport && salesmanList.length === 0 && (
                    <option value="" disabled>
                      Belum ada data salesman
                    </option>
                  )}
                  {salesmanList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Bulan (BLN)
                </label>
                <select
                  value={selectedBln && selectedYear ? `${selectedBln}-${selectedYear}` : ""}
                  onChange={(e) => {
                    const [bln, yr] = e.target.value.split("-");
                    setSelectedBln(bln);
                    setSelectedYear(Number(yr));
                  }}
                  disabled={loadingReport}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="">
                    {loadingReport ? "Memuat periode..." : "-- Pilih Bulan --"}
                  </option>
                  {!loadingReport && periods.length === 0 && (
                    <option value="" disabled>
                      Belum ada data periode
                    </option>
                  )}
                  {periods.map((p) => (
                    <option key={`${p.bln}-${p.year}`} value={`${p.bln}-${p.year}`}>
                      {p.bln} {p.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tahun
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              onClick={loadReportData}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>

          {/* Results */}
          {selectedSalesman && selectedBln ? (
            <>
              {/* Summary Card */}
              <IncentiveSummaryCard
                salesIncentive={salesResult?.total_incentive || 0}
                newPrincipalIncentive={newPrincipalResult?.total_incentive || 0}
                outletIncentive={outletResult?.total_incentive || 0}
                salesmanName={selectedSalesman}
                period={`${selectedBln} ${selectedYear}`}
              />

              {/* Incentive Sales */}
              <IncentiveSalesTable
                data={salesResult}
                title="INCENTIVE SALES"
                loading={loadingReport || loadingCalculation}
              />

              {/* Incentive New Principal */}
              <IncentiveSalesTable
                data={newPrincipalResult}
                title="INCENTIVE SALES NEW PRINCIPAL"
                loading={loadingReport || loadingCalculation}
              />

              {/* Incentive Outlet */}
              <IncentiveOutletTable
                data={outletResult}
                loading={loadingReport || loadingCalculation}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-base font-semibold text-slate-600">
                Pilih Salesman & Periode
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Gunakan filter di atas untuk melihat perhitungan incentive
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
