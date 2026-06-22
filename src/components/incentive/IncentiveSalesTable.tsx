"use client";

import React from "react";
import type { IncentiveSalesResult } from "@/types/incentive";
import { formatIDR, formatPct } from "@/lib/incentiveCalculation";

interface Props {
  data: IncentiveSalesResult | null;
  title: string;
  loading?: boolean;
}

export default function IncentiveSalesTable({ data, title, loading }: Props) {
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
        <div className="text-3xl mb-3">📊</div>
        <p className="text-sm font-medium text-slate-500">
          Belum ada data {title.toLowerCase()}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Upload raw data dan target terlebih dahulu
        </p>
      </div>
    );
  }

  const period = `${data.bln} ${data.year}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-base font-bold text-white tracking-wide">
          {title}
        </h3>
        <p className="text-xs text-blue-100 mt-0.5">
          {data.salesman_name} — Periode {period}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            {/* Row 1: Groups headers */}
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 align-middle">
                Principal
              </th>
              <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 align-middle">
                Target
              </th>
              <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 align-middle">
                Actual
              </th>
              <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 align-middle">
                ACHV %
              </th>
              <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 align-middle">
                Incentive
              </th>
              <th colSpan={data.reward_tiers.length + 1} className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-600 border-l border-slate-200">
                Skema Incentive (CON.% & Reward Tiers)
              </th>
            </tr>
            {/* Row 2: Skema columns */}
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-500 border-l border-slate-200">
                CON. %
              </th>
              {data.reward_tiers.map((t, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {t.tier_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.rows.map((row, i) => {
              const achvColor =
                row.achv_pct >= 100
                  ? "text-emerald-600"
                  : row.achv_pct >= 85
                    ? "text-amber-600"
                    : "text-red-500";
              return (
                <tr
                  key={i}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">
                    {row.principal_group}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatIDR(row.target)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatIDR(row.actual)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${achvColor}`}>
                    {formatPct(row.achv_pct)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
                    {row.incentive > 0
                      ? formatIDR(row.incentive)
                      : "-"}
                  </td>
                  {/* CON.% and reward options for each row */}
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600 font-medium border-l border-slate-200">
                    {formatPct(row.con_pct)}
                  </td>
                  {data.reward_tiers.map((t, j) => (
                    <td
                      key={j}
                      className="px-3 py-3 text-right tabular-nums text-slate-500 text-xs"
                    >
                      {formatIDR(
                        Math.round((row.con_pct / 100) * t.amount)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-600">
                Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                {formatIDR(data.total_target)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                {formatIDR(data.total_actual)}
              </td>
              <td className={`px-4 py-3 text-right tabular-nums ${data.total_achv_pct >= 100 ? "text-emerald-600" : data.total_achv_pct >= 85 ? "text-amber-600" : "text-red-500"}`}>
                {formatPct(data.total_achv_pct)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                {formatIDR(data.total_incentive)}
              </td>
              {/* Total of CON.% and Reward reference */}
              <td className="px-3 py-3 text-right tabular-nums text-slate-800 border-l border-slate-200">
                100.0%
              </td>
              {data.reward_tiers.map((t, j) => (
                <td
                  key={j}
                  className="px-3 py-3 text-right tabular-nums text-slate-800 text-xs"
                >
                  {formatIDR(t.amount)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pencapaian Legend at the bottom */}
      <div className="border-t border-slate-200 bg-slate-50/50 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pencapaian & Reward Tiers Reference
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {data.reward_tiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600">{t.tier_name}:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    Rp {formatIDR(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
