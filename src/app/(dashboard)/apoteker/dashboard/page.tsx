"use client";

import React, { Fragment, useState } from "react";
import { useApotekerDashboard, hasPromelItem } from "@/hooks/useApotekerDashboard";
import { Transaction } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ApotekerDashboard() {
  const {
    orders,
    loading,
    startDate,
    endDate,
    approvalFilter,
    setStartDate,
    setEndDate,
    setApprovalFilter,
    totalOrder,
    pending,
    approved,
    rejected,
    totalAmount,
    loadOrders,
    updateApproval,
    handleReset,
  } = useApotekerDashboard();

  return (
    <div className="w-full space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <span className="text-sm">💊</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Dashboard Apoteker
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-10">
            Approval order yang mengandung produk{" "}
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Promel
            </span>
          </p>
        </div>

        <Button
          onClick={loadOrders}
          variant="outline"
          className="mt-2 sm:mt-0 w-full sm:w-auto"
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total Order Promel" value={totalOrder} icon="📋" />
        <StatCard
          title="Menunggu Approval"
          value={pending}
          icon="⏳"
          color="text-amber-600"
          accent="bg-amber-50 border-amber-200/80"
        />
        <StatCard
          title="Disetujui"
          value={approved}
          icon="✅"
          color="text-emerald-600"
          accent="bg-emerald-50 border-emerald-200/80"
        />
        <StatCard
          title="Ditolak"
          value={rejected}
          icon="❌"
          color="text-red-600"
          accent="bg-red-50 border-red-200/80"
        />
      </div>

      {/* Total Nominal */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Total Nominal Order Promel
              </p>
              <p className="text-2xl font-bold text-emerald-800">
                Rp {totalAmount.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dari tanggal
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sampai tanggal
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Approval
              </label>
              <Select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
              >
                <option value="">Semua status</option>
                <option value="pending">Pending</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </Select>
            </div>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button onClick={loadOrders} className="bg-slate-900 text-white hover:bg-slate-800">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          <p className="text-sm text-slate-500">Memuat data order Promel...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <span className="text-3xl">💊</span>
            </div>
            <p className="text-base font-semibold text-slate-600">Tidak ada order Promel</p>
            <p className="text-sm text-slate-400 max-w-xs">
              Order yang mengandung produk Promel akan muncul di sini untuk persetujuan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ApprovalCard
              key={order.id}
              order={order}
              onApprove={(note) => updateApproval(order.id, "approved", note)}
              onReject={(note) => updateApproval(order.id, "rejected", note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalCard — individual order card with approve / reject controls
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalCard({
  order,
  onApprove,
  onReject,
}: {
  order: Transaction;
  onApprove: (note: string) => void;
  onReject: (note: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionMode, setActionMode] = useState<"idle" | "approving" | "rejecting">("idle");
  const [note, setNote] = useState("");

  const apotekerStatus = order.apoteker_status;
  const isDecided = apotekerStatus === "approved" || apotekerStatus === "rejected";

  const promelItems = (order.transaction_items || []).filter(
    (item) =>
      item.products?.product_name?.toLowerCase().includes("promel") ||
      item.products?.principal_name?.toLowerCase().includes("promel")
  );

  const otherItems = (order.transaction_items || []).filter(
    (item) => !promelItems.includes(item)
  );

  const handleApprove = () => {
    onApprove(note);
    setActionMode("idle");
    setNote("");
  };

  const handleReject = () => {
    onReject(note);
    setActionMode("idle");
    setNote("");
  };

  return (
    <Card
      className={`border transition-all ${
        apotekerStatus === "approved"
          ? "border-emerald-200 bg-emerald-50/30"
          : apotekerStatus === "rejected"
            ? "border-red-200 bg-red-50/30"
            : "border-slate-200 hover:shadow-md"
      }`}
    >
      <CardContent className="p-0">
        {/* Card Header */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            {/* Invoice + date */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-bold text-blue-600 text-sm">
                {order.invoice_number || `INV-${String(order.id).slice(0, 8)}`}
              </span>
              <span className="text-xs text-slate-400">{order.date || "-"}</span>
              {/* Approval status badge */}
              <ApprovalBadge status={apotekerStatus} />
            </div>

            {/* Customer */}
            <p className="font-semibold text-slate-900 uppercase text-sm">
              {order.customers?.customer_name || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Salesman:{" "}
              <span className="font-medium text-slate-700">
                {order.salesman?.full_name || order.salesman_id || "-"}
              </span>
            </p>
          </div>

          {/* Amount + order status */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Total</p>
              <p className="text-base font-bold text-slate-900">
                Rp {Number(order.total_amount || 0).toLocaleString("id-ID")}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Promel Products Highlight */}
        <div className="mx-4 mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">💊</span>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Produk Promel ({promelItems.length})
            </p>
          </div>
          <div className="space-y-1.5">
            {promelItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-100"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {item.products?.product_name || item.product_id}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item.products?.principal_name || ""} · {item.qty} pcs
                    {Number(item.bonus_qty) > 0 && ` + ${item.bonus_qty} bonus`}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-xs font-bold text-emerald-700">
                    Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                  </p>
                  {Number(item.discount) > 0 && (
                    <p className="text-[10px] text-red-500 font-medium">Disc {item.discount}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Items (collapsible) */}
        {otherItems.length > 0 && (
          <div className="mx-4 mb-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer mb-1.5"
            >
              <span>{expanded ? "▼" : "▶"}</span>
              {expanded ? "Sembunyikan" : "Lihat"} produk lainnya ({otherItems.length})
            </button>

            {expanded && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="space-y-1.5">
                  {otherItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-slate-100"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {item.products?.product_name || item.product_id}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.qty} pcs{Number(item.bonus_qty) > 0 && ` + ${item.bonus_qty} bonus`}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 ml-3 shrink-0">
                        Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing apoteker note */}
        {isDecided && order.apoteker_note && (
          <div
            className={`mx-4 mb-3 rounded-xl border px-4 py-2.5 text-xs ${
              apotekerStatus === "approved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
              {apotekerStatus === "approved" ? "Catatan Persetujuan" : "Alasan Penolakan"}
            </span>
            {order.apoteker_note}
          </div>
        )}

        {/* Action Buttons — only show if not decided */}
        {!isDecided && actionMode === "idle" && (
          <div className="border-t border-slate-100 p-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setActionMode("approving")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Setujui
            </Button>
            <Button
              variant="outline"
              onClick={() => setActionMode("rejecting")}
              className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tolak
            </Button>
          </div>
        )}

        {/* Approve confirmation */}
        {actionMode === "approving" && (
          <div className="border-t border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-700">
              ✓ Konfirmasi Persetujuan
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Catatan (opsional)
              </label>
              <Input
                placeholder="Tambah catatan persetujuan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
              >
                Ya, Setujui
              </Button>
              <Button
                variant="outline"
                onClick={() => { setActionMode("idle"); setNote(""); }}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Reject form */}
        {actionMode === "rejecting" && (
          <div className="border-t border-red-100 bg-red-50/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">
              ✗ Konfirmasi Penolakan
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Tuliskan alasan penolakan order ini..."
                className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white flex-1"
                disabled={!note.trim()}
              >
                Ya, Tolak
              </Button>
              <Button
                variant="outline"
                onClick={() => { setActionMode("idle"); setNote(""); }}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalBadge
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalBadge({ status }: { status?: string | null }) {
  if (!status || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Menunggu Approval
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Disetujui
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Ditolak
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  color = "text-slate-900",
  accent,
}: {
  title: string;
  value: number;
  icon?: string;
  color?: string;
  accent?: string;
}) {
  return (
    <Card className={`border-slate-200 transition-shadow hover:shadow-md ${accent || ""}`}>
      <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-1">
        {icon && <span className="text-lg leading-none mb-0.5">{icon}</span>}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={`text-xl font-bold ${color} leading-tight`}>{value}</p>
      </CardContent>
    </Card>
  );
}
