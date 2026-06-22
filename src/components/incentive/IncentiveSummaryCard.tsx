"use client";

import React from "react";
import { formatIDR } from "@/lib/incentiveCalculation";

interface Props {
  salesIncentive: number;
  newPrincipalIncentive: number;
  outletIncentive: number;
  salesmanName: string;
  period: string;
}

export default function IncentiveSummaryCard({
  salesIncentive,
  newPrincipalIncentive,
  outletIncentive,
  salesmanName,
  period,
}: Props) {
  const total = salesIncentive + newPrincipalIncentive + outletIncentive;

  const items = [
    {
      label: "Incentive Sales",
      value: salesIncentive,
      icon: "💰",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      label: "Incentive New Principal",
      value: newPrincipalIncentive,
      icon: "🌟",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      label: "Incentive Outlet",
      value: outletIncentive,
      icon: "🏪",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Total section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Total Incentive
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {salesmanName} — {period}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-xl">
            🎯
          </div>
        </div>
        <p
          className={`mt-4 text-3xl font-black tracking-tight ${
            total >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          Rp {formatIDR(Math.abs(total))}
          {total < 0 && (
            <span className="text-sm font-normal text-red-400/70 ml-2">
              (deficit)
            </span>
          )}
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {items.map((item, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} text-sm shadow-sm`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {item.label}
              </span>
            </div>
            <p
              className={`text-lg font-bold tabular-nums ${
                item.value >= 0 ? "text-slate-800" : "text-red-500"
              }`}
            >
              Rp {formatIDR(Math.abs(item.value))}
              {item.value < 0 && (
                <span className="text-xs text-red-400 ml-1">(−)</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
