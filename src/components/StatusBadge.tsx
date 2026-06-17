import React from "react";

interface StatusBadgeProps {
  status: string | null | undefined;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  proses: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  done: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  reject: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

const DEFAULT_CONFIG = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  dot: "bg-slate-400",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cleanStatus = (status || "pending").trim().toLowerCase();
  const config = STATUS_CONFIG[cleanStatus] || DEFAULT_CONFIG;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {cleanStatus}
    </span>
  );
}
