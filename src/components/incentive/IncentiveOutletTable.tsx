"use client";

import React from "react";
import type { IncentiveOutletResult } from "@/types/incentive";
import {
  formatIDR,
  OUTLET_PRINCIPAL_REFERENCE_TIERS,
  OUTLET_TOTAL_REFERENCE_TIERS,
} from "@/lib/incentiveCalculation";

interface Props {
  data: IncentiveOutletResult | null;
  loading?: boolean;
}

function formatIncentive(value: number): string {
  if (value === 0) return "-";
  return value >= 0
    ? formatIDR(value)
    : `(${formatIDR(Math.abs(value))})`;
}

export default function IncentiveOutletTable({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <span className="text-sm text-slate-500">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="text-3xl mb-3">🏪</div>
        <p className="text-sm font-medium text-slate-500">
          Belum ada data incentive outlet transaksi
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Upload raw data dan target outlet terlebih dahulu
        </p>
      </div>
    );
  }

  const period = `${data.bln} ${data.year}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Incentive Outlet Transaksi
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              {data.salesman_name} — Periode {period}
            </p>
          </div>
          <div className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2">
            <p className="text-[10px] text-amber-100 uppercase tracking-wider">
              Jumlah Outlet
            </p>
            <p className="text-xl font-black text-white">
              {data.total_outlet_owned}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  OT Principal
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Outlet
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actual Transaksi
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Incentive Diterima
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">
                    {row.principal_group}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.target_outlet}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.actual_outlet}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      row.incentive >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {formatIncentive(row.incentive)}
                  </td>
                </tr>
              ))}

              {/* TOTAL ALL OT row */}
              <tr className="bg-amber-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800 text-xs">
                  TOTAL ALL OT
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700">
                  {data.total_all_ot_target}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700">
                  {data.total_actual_outlet}
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold tabular-nums ${
                    data.outlet_tier_reward >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {formatIncentive(data.outlet_tier_reward)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600"
                >
                  Total
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    data.total_incentive >= 0
                      ? "text-blue-700"
                      : "text-red-600"
                  }`}
                >
                  {formatIncentive(data.total_incentive)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right side — Tabel Incentive reference (sesuai Excel) */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 w-full lg:w-[340px] shrink-0">
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Tabel Incentive
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-2 text-left font-bold text-slate-500" />
                    {OUTLET_PRINCIPAL_REFERENCE_TIERS.map((tier) => (
                      <th
                        key={tier.label}
                        className="py-2 px-1 text-right font-bold text-[9px] uppercase text-slate-500 leading-tight"
                      >
                        {tier.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-2 text-[10px] font-semibold text-slate-600">
                      Total
                    </td>
                    {OUTLET_TOTAL_REFERENCE_TIERS.map((tier) => (
                      <td
                        key={tier.label}
                        className="py-2 px-1 text-right tabular-nums font-medium text-slate-700"
                      >
                        {formatIncentive(tier.amount)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100 bg-blue-50/40">
                    <td className="py-2 pr-2 text-[10px] font-semibold text-blue-700">
                      Per OT
                    </td>
                    {OUTLET_PRINCIPAL_REFERENCE_TIERS.map((tier) => (
                      <td
                        key={tier.label}
                        className={`py-2 px-1 text-right tabular-nums font-semibold ${
                          data.outlet_tier_name === tier.label
                            ? "text-emerald-700 bg-emerald-50"
                            : tier.amount < 0
                              ? "text-red-500"
                              : "text-slate-700"
                        }`}
                      >
                        {formatIncentive(tier.amount)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-[10px] font-semibold text-slate-600">
                      Total
                    </td>
                    {OUTLET_TOTAL_REFERENCE_TIERS.map((tier) => (
                      <td
                        key={tier.label}
                        className="py-2 px-1 text-right tabular-nums font-medium text-slate-700"
                      >
                        {formatIncentive(tier.amount)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] text-amber-700 uppercase tracking-wider font-bold">
                Tier Aktif — TOTAL ALL OT
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {data.total_actual_outlet} outlet →{" "}
                <span className="font-bold">{data.outlet_tier_name}</span>
              </p>
              <p className="text-sm font-black text-amber-900 mt-0.5">
                {formatIncentive(data.outlet_tier_reward)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
