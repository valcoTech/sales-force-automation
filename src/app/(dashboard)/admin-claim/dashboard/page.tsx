"use client";

import React from "react";
import { useAdminClaimDashboard } from "@/hooks/useAdminClaimDashboard";
import OrderTable from "@/components/OrderTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminClaimDashboard() {
  const {
    orders,
    salesmen,
    loading,
    startDate,
    endDate,
    claimStatusFilter,
    setStartDate,
    setEndDate,
    setClaimStatusFilter,
    totalOrder,
    totalAmount,
    totalItem,
    loadOrders,
    updateClaimStatus,
    handleReset,
  } = useAdminClaimDashboard();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Admin Claim
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Validasi klaim diskon dan approval order item dari salesmen.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total Order" value={totalOrder} icon="📋" />
        <StatCard title="Total Nominal" value={`Rp ${totalAmount.toLocaleString("id-ID")}`} icon="💰" />
        <StatCard title="Total Item" value={totalItem} icon="📦" />
        <StatCard title="Salesman Aktif" value={salesmen.length} icon="👥" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dari tanggal
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sampai tanggal
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Claim
              </label>
              <Select value={claimStatusFilter} onChange={(e) => setClaimStatusFilter(e.target.value)}>
                <option value="">Semua status claim</option>
                <option value="pending">Pending</option>
                <option value="proses">Proses</option>
                <option value="done">Done</option>
                <option value="reject">Reject</option>
              </Select>
            </div>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button onClick={loadOrders} className="bg-slate-900 text-white hover:bg-slate-800">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat data klaim...</p>
        </div>
      ) : (
        <OrderTable
          orders={orders}
          showSalesman
          showItems
          showClaimStatus
          onClaimStatusChange={updateClaimStatus}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon?: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-1">
        {icon && <span className="text-lg leading-none mb-0.5">{icon}</span>}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="font-bold text-slate-900 text-sm leading-tight break-all">{value}</p>
      </CardContent>
    </Card>
  );
}
