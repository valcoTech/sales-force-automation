"use client";

import React from "react";
import Link from "next/link";
import { useSalesmanDashboard } from "@/hooks/useSalesmanDashboard";
import OrderTable from "@/components/OrderTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function SalesmanDashboard() {
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
    reject,
    loadOrders,
    handleReset,
  } = useSalesmanDashboard();

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard Salesman
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan order yang kamu input hari ini.
          </p>
        </div>

        <Link href="/salesman/order" passHref>
          <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/20">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Order Baru
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Order" value={totalOrder} icon="📋" />
        <StatCard
          title="Total Nominal"
          value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
          icon="💰"
          className="col-span-2 sm:col-span-1"
        />
        <StatCard title="Pending" value={pending} icon="⏳" color="text-amber-600" />
        <StatCard title="Proses" value={proses} icon="🔄" color="text-blue-600" />
        <StatCard title="Done" value={done} icon="✅" color="text-emerald-600" />
        <StatCard title="Reject" value={reject} icon="❌" color="text-red-600" />
      </div>

      {/* Filter Card */}
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
                Status
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

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat data order...</p>
        </div>
      ) : (
        <OrderTable orders={orders} showItems showClaimStatus />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = "text-slate-900",
  className = "",
}: {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  className?: string;
}) {
  return (
    <Card className={`transition-shadow hover:shadow-md ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-1">
        {icon && <span className="text-lg leading-none mb-0.5">{icon}</span>}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={`font-bold ${color} text-sm leading-tight break-all`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
