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
  fetchRawDataForPeriod,
  fetchTargetsForPeriod,
  fetchTargetOutletsForPeriod,
  fetchNewPrincipalTargetsForPeriod,
} from "@/lib/fetchIncentiveData";
import IncentiveSalesTable from "@/components/incentive/IncentiveSalesTable";
import IncentiveOutletTable from "@/components/incentive/IncentiveOutletTable";
import IncentiveSummaryCard from "@/components/incentive/IncentiveSummaryCard";

export default function SalesmanIncentivePage() {
  const [salesmanName, setSalesmanName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCalculation, setLoadingCalculation] = useState(false);

  // Filter options
  const [periods, setPeriods] = useState<{ bln: string; month: string; year: number }[]>([]);
  const [selectedBln, setSelectedBln] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Results
  const [salesResult, setSalesResult] = useState<IncentiveSalesResult | null>(null);
  const [newPrincipalResult, setNewPrincipalResult] = useState<IncentiveSalesResult | null>(null);
  const [outletResult, setOutletResult] = useState<IncentiveOutletResult | null>(null);

  // Get current user's name
  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.full_name) {
        setSalesmanName(data.full_name);
      }
    };
    getProfile();
  }, []);

  // Load available periods
  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const { periods: periodList } = await fetchIncentiveFilters();
      setPeriods(periodList);
    } catch (err) {
      console.error("Failed to load periods:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  // Auto-select latest period
  useEffect(() => {
    if (periods.length > 0 && !selectedBln) {
      const latest = periods[periods.length - 1];
      setSelectedBln(latest.bln);
      setSelectedYear(latest.year);
    }
  }, [periods, selectedBln]);

  // Fetch period data & recalculate
  useEffect(() => {
    if (!salesmanName || !selectedBln || !selectedYear) return;

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
          calculateIncentiveSales(rawData, targets, salesmanName, selectedBln, selectedYear)
        );
        setNewPrincipalResult(
          calculateIncentiveNewPrincipal(rawData, newPrincipalTargets, salesmanName, selectedBln, selectedYear)
        );
        setOutletResult(
          calculateIncentiveOutlet(rawData, targetOutlets, salesmanName, selectedBln, selectedYear)
        );
      } catch (err) {
        console.error("Failed to calculate incentive:", err);
      } finally {
        if (!cancelled) setLoadingCalculation(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [salesmanName, selectedBln, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat data incentive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Incentive Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat perhitungan incentive berdasarkan kinerja penjualan
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Periode:</label>
          <select
            value={`${selectedBln}-${selectedYear}`}
            onChange={(e) => {
              const [bln, yr] = e.target.value.split("-");
              setSelectedBln(bln);
              setSelectedYear(Number(yr));
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {periods.map((p) => (
              <option key={`${p.bln}-${p.year}`} value={`${p.bln}-${p.year}`}>
                {p.bln} {p.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {salesResult && selectedBln ? (
        <>
          {/* Summary */}
          <IncentiveSummaryCard
            salesIncentive={salesResult?.total_incentive || 0}
            newPrincipalIncentive={newPrincipalResult?.total_incentive || 0}
            outletIncentive={outletResult?.total_incentive || 0}
            salesmanName={salesmanName}
            period={`${selectedBln} ${selectedYear}`}
          />

          {/* Incentive Sales */}
          <IncentiveSalesTable
            data={salesResult}
            title="INCENTIVE SALES"
          />

          {/* Incentive New Principal */}
          <IncentiveSalesTable
            data={newPrincipalResult}
            title="INCENTIVE SALES NEW PRINCIPAL"
          />

          {/* Incentive Outlet */}
          <IncentiveOutletTable data={outletResult} />
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-base font-semibold text-slate-600">
            Belum Ada Data Incentive
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Data incentive belum tersedia untuk periode ini. Hubungi supervisor.
          </p>
        </div>
      )}
    </div>
  );
}
