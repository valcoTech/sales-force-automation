"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchIncentiveFilters } from "@/lib/fetchIncentiveData";
import { OUTLET_SUPPLIERS, matchOutletSupplier } from "@/lib/outletSuppliers";
import { formatIDR } from "@/lib/incentiveCalculation";

interface OutletStatus {
  cust_ship_id: string;
  cust_ship_name: string;
  supplier_name: string;
  matched_supplier: string;
  has_transaction: boolean;
  total_value: number;
}

export default function SupervisorOutletCheckPage() {
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Filter options
  const [periods, setPeriods] = useState<{ bln: string; month: string; year: number }[]>([]);
  const [salesmanList, setSalesmanList] = useState<string[]>([]);

  const [selectedSalesman, setSelectedSalesman] = useState<string>("");
  const [selectedBln, setSelectedBln] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedSupplier, setSelectedSupplier] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TRANSACTED" | "NOT_TRANSACTED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Raw data from DB
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Load available periods and salesmen
  useEffect(() => {
    const loadFilters = async () => {
      setLoadingFilters(true);
      try {
        const { periods: periodList, salesmen: names } = await fetchIncentiveFilters();
        setPeriods(periodList);
        setSalesmanList(names);

        if (names.length > 0) {
          setSelectedSalesman(names[0]);
        }

        if (periodList.length > 0) {
          const latest = periodList[periodList.length - 1];
          setSelectedBln(latest.bln);
          setSelectedYear(latest.year);
        }
      } catch (err) {
        console.error("Failed to load periods and salesmen:", err);
      } finally {
        setLoadingFilters(false);
      }
    };
    loadFilters();
  }, []);

  // Fetch raw data when salesman or year changes
  useEffect(() => {
    if (!selectedSalesman || !selectedYear) return;

    let cancelled = false;
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Fetch raw_data for the selected salesman in this year
        const { data, error } = await supabase
          .from("raw_data")
          .select("cust_ship_id, cust_ship_name, supplier_name, bln, year, gs_value")
          .ilike("ar_slsm_name", `${selectedSalesman.trim()}%`)
          .eq("year", selectedYear);

        if (error) throw error;

        if (!cancelled) {
          setRawRows(data || []);
        }
      } catch (err) {
        console.error("Failed to load raw data:", err);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [selectedSalesman, selectedYear]);

  // Compute status for all unique outlets
  const outletStatuses = useMemo(() => {
    if (rawRows.length === 0 || !selectedBln || !selectedYear) return [];

    const pairingsMap = new Map<string, { cust_ship_id: string; cust_ship_name: string; supplier_name: string }>();
    const periodValueMap = new Map<string, number>();

    for (const row of rawRows) {
      const custId = (row.cust_ship_id || "").trim();
      const custName = (row.cust_ship_name || "").trim();
      const supplier = (row.supplier_name || "").trim();
      if (!custId) continue;

      const key = `${custId}||${supplier}`;
      if (!pairingsMap.has(key)) {
        pairingsMap.set(key, {
          cust_ship_id: custId,
          cust_ship_name: custName,
          supplier_name: supplier,
        });
      }

      const rowBln = String(row.bln || "").trim().toLowerCase();
      const selBln = String(selectedBln || "").trim().toLowerCase();
      if (rowBln === selBln && Number(row.year) === Number(selectedYear)) {
        const val = Number(row.gs_value) || 0;
        periodValueMap.set(key, (periodValueMap.get(key) || 0) + val);
      }
    }

    const list: OutletStatus[] = [];
    for (const [key, info] of pairingsMap.entries()) {
      const val = periodValueMap.get(key) || 0;
      const matched = matchOutletSupplier(info.supplier_name);
      list.push({
        cust_ship_id: info.cust_ship_id,
        cust_ship_name: info.cust_ship_name,
        supplier_name: info.supplier_name,
        matched_supplier: matched || info.supplier_name,
        has_transaction: val > 0,
        total_value: Math.max(0, val),
      });
    }

    return list;
  }, [rawRows, selectedBln, selectedYear]);

  // Filter and Search
  const filteredOutlets = useMemo(() => {
    return outletStatuses.filter((item) => {
      if (selectedSupplier !== "ALL") {
        const matched = matchOutletSupplier(item.supplier_name);
        if (matched !== selectedSupplier) return false;
      }

      if (statusFilter === "TRANSACTED" && !item.has_transaction) return false;
      if (statusFilter === "NOT_TRANSACTED" && item.has_transaction) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesId = item.cust_ship_id.toLowerCase().includes(query);
        const matchesName = item.cust_ship_name.toLowerCase().includes(query);
        const matchesSupplier = item.supplier_name.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesSupplier) return false;
      }

      return true;
    });
  }, [outletStatuses, selectedSupplier, statusFilter, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const listForStats = selectedSupplier === "ALL"
      ? outletStatuses
      : outletStatuses.filter(item => matchOutletSupplier(item.supplier_name) === selectedSupplier);

    const total = listForStats.length;
    const transacted = listForStats.filter((item) => item.has_transaction).length;
    const notTransacted = total - transacted;
    const penetration = total > 0 ? (transacted / total) * 100 : 0;

    return { total, transacted, notTransacted, penetration };
  }, [outletStatuses, selectedSupplier]);

  if (loadingFilters) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat konfigurasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Check Outlet Transaksi (Supervisor)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau outlet yang sudah dan belum bertransaksi per salesman untuk periode berjalan
        </p>
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Salesman Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Pilih Salesman
            </label>
            <select
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {salesmanList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Periode
            </label>
            <select
              value={`${selectedBln}-${selectedYear}`}
              onChange={(e) => {
                const [bln, yr] = e.target.value.split("-");
                setSelectedBln(bln);
                setSelectedYear(Number(yr));
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {periods.map((p) => (
                <option key={`${p.bln}-${p.year}`} value={`${p.bln}-${p.year}`}>
                  {p.bln} {p.year}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier (Principal) Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Filter Principal
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">Semua Principal (All)</option>
              {OUTLET_SUPPLIERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Status Transaksi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">Semua Status</option>
              <option value="TRANSACTED">Sudah Bertransaksi</option>
              <option value="NOT_TRANSACTED">Belum Bertransaksi</option>
            </select>
          </div>

          {/* Text Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Cari Outlet
            </label>
            <input
              type="text"
              placeholder="Cari ID / nama outlet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Total Outlet
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">
            Sudah Transaksi
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {stats.transacted.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
            Belum Transaksi
          </p>
          <p className="text-2xl font-black text-red-600 mt-1">
            {stats.notTransacted.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">
            Penetrasi Outlet
          </p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {stats.penetration.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="text-xs text-slate-500">Memproses data outlet...</p>
            </div>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-sm font-semibold text-slate-500">
              Tidak ada data outlet ditemukan
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan filter pencarian atau principal Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    ID Outlet
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nama Outlet
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nama Supplier
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Transaksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOutlets.map((item, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3 font-semibold text-xs text-slate-500 tabular-nums">
                      {item.cust_ship_id}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800 text-xs">
                      {item.cust_ship_name}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {item.supplier_name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {item.has_transaction ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                          Sudah Transaksi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-100">
                          Belum Transaksi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">
                      {item.total_value > 0 ? (
                        `Rp ${formatIDR(item.total_value)}`
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
