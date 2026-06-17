"use client";

import React from "react";
import { useAdminSalesDashboard } from "@/hooks/useAdminSalesDashboard";
import OrderTable from "@/components/OrderTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminSalesDashboard() {
  const {
    orders,
    loading,
    startDate,
    endDate,
    statusFilter,
    setStartDate,
    setEndDate,
    setStatusFilter,
    totalOrder,
    totalAmount,
    pending,
    proses,
    done,
    salesmanCount,
    loadOrders,
    updateStatus,
    handleReset,
  } = useAdminSalesDashboard();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Admin Sales
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Validasi, terima order, dan update status proses order dari salesman.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Order" value={totalOrder} icon="📋" />
        <StatCard title="Total Nominal" value={`Rp ${totalAmount.toLocaleString("id-ID")}`} icon="💰" />
        <StatCard title="Salesman Aktif" value={salesmanCount} icon="👥" />
        <StatCard title="Pending" value={pending} icon="⏳" color="text-amber-600" accent="bg-amber-50 border-amber-200/80" />
        <StatCard title="Proses" value={proses} icon="🔄" color="text-blue-600" accent="bg-blue-50 border-blue-200/80" />
        <StatCard title="Done" value={done} icon="✅" color="text-emerald-600" accent="bg-emerald-50 border-emerald-200/80" />
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
                Status Order
              </label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Semua status</option>
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
          <p className="text-sm text-slate-500">Memuat data order...</p>
        </div>
      ) : (
        <OrderTable
          orders={orders}
          showSalesman
          showItems
          showClaimStatus
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = "text-slate-900",
  accent,
}: {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  accent?: string;
}) {
  return (
    <Card className={`transition-shadow hover:shadow-md ${accent || ""}`}>
      <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-1">
        {icon && <span className="text-lg leading-none mb-0.5">{icon}</span>}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={`font-bold ${color} text-sm leading-tight break-all`}>{value}</p>
      </CardContent>
    </Card>
  );
}
