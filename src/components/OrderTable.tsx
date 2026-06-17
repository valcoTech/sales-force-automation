"use client";

import React, { Fragment, useState } from "react";
import StatusBadge from "./StatusBadge";
import { Transaction } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OrderTableProps {
  orders: Transaction[];
  showSalesman?: boolean;
  showItems?: boolean;
  showClaimStatus?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onClaimStatusChange?: (id: string, claimStatus: string, rejectReason: string) => void;
}

export default function OrderTable({
  orders = [],
  showSalesman = false,
  showItems = false,
  showClaimStatus = false,
  onStatusChange,
  onClaimStatusChange,
}: OrderTableProps) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});

  const canUpdateClaim = Boolean(onClaimStatusChange);

  const colSpan =
    5 +
    (showSalesman ? 1 : 0) +
    (showClaimStatus ? 1 : 0) +
    (onStatusChange ? 1 : 0) +
    (canUpdateClaim ? 1 : 0);

  const toggleOrder = (orderId: string) => {
    setOpenOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleClaimChange = (order: Transaction, value: string) => {
    if (!canUpdateClaim || !onClaimStatusChange) return;

    if (value === "reject") {
      setOpenOrderId(order.id);
      setRejectDraft((prev) => ({
        ...prev,
        [order.id]: order.claim_reject_reason || "",
      }));
      return;
    }

    onClaimStatusChange(order.id, value, "");
  };

  const submitReject = (orderId: string) => {
    const reason = rejectDraft[orderId] || "";
    if (!canUpdateClaim || !onClaimStatusChange) return;

    onClaimStatusChange(orderId, "reject", reason);
  };

  const cancelReject = (orderId: string) => {
    setRejectDraft((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* MOBILE & TABLET LAYOUT (lg:hidden)                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3 lg:hidden">
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">Belum ada order</p>
            </div>
          </Card>
        ) : (
          orders.map((order) => {
            const isOpen = openOrderId === order.id;
            const items = order.transaction_items || [];
            const salesmanName =
              order.salesman?.full_name ||
              (order as any).users?.full_name ||
              order.salesman_id ||
              "-";

            const rejectReason = order.claim_reject_reason;
            const isRejectDraftOpen = rejectDraft[order.id] !== undefined;

            return (
              <Card
                key={order.id}
                className={`p-0 transition-all ${
                  isOpen ? "border-blue-300 ring-1 ring-blue-100 shadow-md" : "hover:shadow-sm"
                }`}
              >
                {/* Card Header */}
                <div
                  onClick={() => showItems && toggleOrder(order.id)}
                  className="flex flex-col gap-2 p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-blue-600 text-sm truncate">
                      {order.invoice_number || `INV-${String(order.id).slice(0, 8)}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium shrink-0">{order.date || "-"}</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase truncate">
                      {order.customers?.customer_name || "-"}
                    </h4>
                    {showSalesman && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Salesman: <span className="font-medium text-slate-700">{salesmanName}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 mt-1">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total</p>
                      <p className="font-bold text-slate-900 text-sm">
                        Rp {Number(order.total_amount || 0).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-medium">Order:</span>
                          <StatusBadge status={order.status} />
                        </div>
                        {showClaimStatus && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Claim:</span>
                            <StatusBadge status={order.claim_status || "pending"} />
                          </div>
                        )}
                      </div>
                      {showItems && (
                        <span className="text-slate-300 pl-1.5 text-xs transition-transform duration-200">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Status Selectors */}
                {(onStatusChange || canUpdateClaim) && (
                  <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {onStatusChange && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Update Order</label>
                        <Select
                          value={order.status || "pending"}
                          onChange={(e) => onStatusChange(order.id, e.target.value)}
                          className="h-9 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="proses">Proses</option>
                          <option value="done">Done</option>
                          <option value="reject">Reject</option>
                        </Select>
                      </div>
                    )}
                    {canUpdateClaim && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Update Claim</label>
                        <Select
                          value={order.claim_status || "pending"}
                          onChange={(e) => handleClaimChange(order, e.target.value)}
                          className="h-9 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="proses">Proses</option>
                          <option value="done">Done</option>
                          <option value="reject">Reject</option>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Expanded Items */}
                {showItems && isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    {isRejectDraftOpen && canUpdateClaim && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <label className="mb-1 block text-xs font-semibold text-red-700 uppercase tracking-wider">
                          Alasan Reject
                        </label>
                        <textarea
                          value={rejectDraft[order.id] || ""}
                          onChange={(e) =>
                            setRejectDraft((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-400"
                          placeholder="Tulis alasan reject di sini..."
                        />
                        <div className="mt-2.5 flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => cancelReject(order.id)} className="text-red-600 border-red-200 hover:bg-white text-xs">
                            Batal
                          </Button>
                          <Button size="sm" onClick={() => submitReject(order.id)} className="bg-red-600 hover:bg-red-700 text-xs">
                            Simpan Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {order.claim_status === "reject" && rejectReason && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold uppercase tracking-wider text-[9px] block text-red-600 mb-0.5">Alasan Reject</span>
                        {rejectReason}
                      </div>
                    )}

                    <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1.5">Detail Item ({items.length})</p>
                      {items.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">Item tidak ditemukan</p>
                      ) : (
                        <div className="space-y-2.5 divide-y divide-slate-100">
                          {items.map((item, idx) => (
                            <div key={item.id} className={`flex flex-col gap-1 text-xs ${idx > 0 ? "pt-2.5" : ""}`}>
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-medium text-slate-800 break-words min-w-0">{item.products?.product_name || "-"}</span>
                                <span className="font-bold text-slate-900 shrink-0">
                                  Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="truncate">{item.product_id}</span>
                                <span className="shrink-0 ml-2">
                                  {item.qty || 0} pcs {Number(item.bonus_qty) > 0 && `(Bonus: ${item.bonus_qty})`}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Harga: Rp {Number(item.price_at_time || 0).toLocaleString("id-ID")}</span>
                                {Number(item.discount) > 0 && <span className="text-red-500 font-medium">Disc: {item.discount}%</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:block)                                          */}
      {/* ========================================================================= */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">Invoice</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Customer</th>
                {showSalesman && <th className="px-4 py-3.5 whitespace-nowrap">Salesman</th>}
                <th className="px-4 py-3.5 whitespace-nowrap">Total</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status Order</th>
                {showClaimStatus && <th className="px-4 py-3.5 whitespace-nowrap">Status Claim</th>}
                {onStatusChange && <th className="px-4 py-3.5 whitespace-nowrap">Update Order</th>}
                {canUpdateClaim && <th className="px-4 py-3.5 whitespace-nowrap">Update Claim</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-400">Belum ada order</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isOpen = openOrderId === order.id;
                  const items = order.transaction_items || [];
                  const salesmanName =
                    order.salesman?.full_name ||
                    (order as any).users?.full_name ||
                    order.salesman_id ||
                    "-";

                  const rejectReason = order.claim_reject_reason;
                  const isRejectDraftOpen = rejectDraft[order.id] !== undefined;

                  return (
                    <Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/50 text-slate-700 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {showItems ? (
                            <button
                              type="button"
                              onClick={() => toggleOrder(order.id)}
                              className="inline-flex items-center gap-2 font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              <span className="text-xs transition-transform duration-200">
                                {isOpen ? "▼" : "▶"}
                              </span>
                              <span>{order.invoice_number || `INV-${String(order.id).slice(0, 8)}`}</span>
                            </button>
                          ) : (
                            <span className="font-bold text-blue-600">
                              {order.invoice_number || `INV-${String(order.id).slice(0, 8)}`}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{order.date || "-"}</td>

                        <td className="px-4 py-3.5 font-semibold text-slate-900 uppercase">
                          {order.customers?.customer_name || "-"}
                        </td>

                        {showSalesman && (
                          <td className="px-4 py-3.5 text-slate-600">{salesmanName}</td>
                        )}

                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          Rp {Number(order.total_amount || 0).toLocaleString("id-ID")}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>

                        {showClaimStatus && (
                          <td className="px-4 py-3.5">
                            <StatusBadge status={order.claim_status || "pending"} />
                          </td>
                        )}

                        {onStatusChange && (
                          <td className="px-4 py-3.5">
                            <Select
                              value={order.status || "pending"}
                              onChange={(e) => onStatusChange(order.id, e.target.value)}
                              className="h-9 text-xs"
                              wrapperClassName="w-auto"
                            >
                              <option value="pending">Pending</option>
                              <option value="proses">Proses</option>
                              <option value="done">Done</option>
                              <option value="reject">Reject</option>
                            </Select>
                          </td>
                        )}

                        {canUpdateClaim && (
                          <td className="px-4 py-3.5">
                            <Select
                              value={order.claim_status || "pending"}
                              onChange={(e) => handleClaimChange(order, e.target.value)}
                              className="h-9 text-xs"
                              wrapperClassName="w-auto"
                            >
                              <option value="pending">Pending</option>
                              <option value="proses">Proses</option>
                              <option value="done">Done</option>
                              <option value="reject">Reject</option>
                            </Select>
                          </td>
                        )}
                      </tr>

                      {showItems && isOpen && (
                        <tr>
                          <td colSpan={colSpan} className="bg-slate-50/50 px-5 py-4">
                            {isRejectDraftOpen && canUpdateClaim && (
                              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 max-w-xl">
                                <label className="mb-2 block text-sm font-semibold text-red-700 uppercase tracking-wider">
                                  Alasan Reject
                                </label>
                                <textarea
                                  value={rejectDraft[order.id] || ""}
                                  onChange={(e) =>
                                    setRejectDraft((prev) => ({
                                      ...prev,
                                      [order.id]: e.target.value,
                                    }))
                                  }
                                  rows={3}
                                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 bg-white text-slate-800"
                                  placeholder="Tulis alasan reject di sini..."
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => cancelReject(order.id)} className="text-red-600 border-red-200 hover:bg-white">
                                    Batal
                                  </Button>
                                  <Button onClick={() => submitReject(order.id)} className="bg-red-600 hover:bg-red-700">
                                    Simpan Reject
                                  </Button>
                                </div>
                              </div>
                            )}

                            {order.claim_status === "reject" && rejectReason && (
                              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 max-w-xl">
                                <span className="font-semibold uppercase tracking-wider text-xs block text-red-600 mb-1">
                                  Alasan Reject
                                </span>
                                {rejectReason}
                              </div>
                            )}

                            <Card className="border-slate-200">
                              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                  Order Details ({items.length} items)
                                </p>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-slate-700">
                                  <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                                    <tr>
                                      <th className="px-4 py-2.5 text-left">Product</th>
                                      <th className="px-4 py-2.5 text-left">Qty</th>
                                      <th className="px-4 py-2.5 text-left">Bonus</th>
                                      <th className="px-4 py-2.5 text-left">Harga</th>
                                      <th className="px-4 py-2.5 text-left">Disc</th>
                                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                          Item tidak ditemukan
                                        </td>
                                      </tr>
                                    ) : (
                                      items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                          <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800">
                                              {item.products?.product_name || "-"}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                              {item.product_id}
                                            </p>
                                          </td>
                                          <td className="px-4 py-3">{item.qty || 0}</td>
                                          <td className="px-4 py-3">{item.bonus_qty || 0}</td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            Rp {Number(item.price_at_time || 0).toLocaleString("id-ID")}
                                          </td>
                                          <td className="px-4 py-3 text-red-500 font-medium">
                                            {Number(item.discount || 0).toLocaleString("id-ID")}%
                                          </td>
                                          <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                            Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </Card>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
