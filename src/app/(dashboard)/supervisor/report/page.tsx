"use client";

import React, { useState } from "react";
import { useSupervisorReport } from "@/hooks/useSupervisorReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TabKey = "principal" | "salesman" | "outlet" | "outlet-principal";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "principal", label: "Sales per Principal", icon: "🏢" },
  { key: "salesman", label: "Penjualan Salesman", icon: "👤" },
  { key: "outlet", label: "Outlet Transaksi", icon: "🏪" },
  { key: "outlet-principal", label: "Outlet x Principal", icon: "📊" },
];

export default function SupervisorReportPage() {
  const {
    loading,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    principalSales,
    salesmanSales,
    salesmanOutlets,
    outletByPrincipalBySalesman,
    grandTotalSales,
    totalSalesman,
    loadReport,
    handleReset,
  } = useSupervisorReport();

  const [activeTab, setActiveTab] = useState<TabKey>("principal");

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          📈 Report Supervisor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Laporan ringkasan penjualan, salesman, dan outlet transaksi.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Total Penjualan"
          value={`Rp ${grandTotalSales.toLocaleString("id-ID")}`}
          icon="💰"
          accent="from-emerald-500 to-teal-600"
        />
        <SummaryCard
          title="Jumlah Principal"
          value={principalSales.length}
          icon="🏢"
          accent="from-blue-500 to-indigo-600"
        />
        <SummaryCard
          title="Salesman Aktif"
          value={totalSalesman}
          icon="👥"
          accent="from-violet-500 to-purple-600"
        />
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dari tanggal
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sampai tanggal
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              onClick={loadReport}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Memuat data report...</p>
        </div>
      ) : (
        <>
          {activeTab === "principal" && (
            <PrincipalSalesTable data={principalSales} grandTotal={grandTotalSales} />
          )}
          {activeTab === "salesman" && (
            <SalesmanSalesTable data={salesmanSales} />
          )}
          {activeTab === "outlet" && (
            <SalesmanOutletTable data={salesmanOutlets} />
          )}
          {activeTab === "outlet-principal" && (
            <OutletPrincipalSalesmanTable data={outletByPrincipalBySalesman} />
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────── Summary Card ──────────────── */
function SummaryCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="relative">
        <span className="text-2xl">{icon}</span>
        <p className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="mt-1 text-lg font-bold text-slate-900 break-all">{value}</p>
      </div>
    </div>
  );
}

/* ──────────────── Badge Component ──────────────── */
function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "blue" | "violet" | "amber" | "emerald";
}) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   Report 1: Total Sales Value per Principal
   ══════════════════════════════════════════════════ */
function PrincipalSalesTable({
  data,
  grandTotal,
}: {
  data: { principal_name: string; total_value: number; total_items: number }[];
  grandTotal: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏢</span> Total Sales Value per Principal
        </CardTitle>
        <p className="text-sm text-slate-500">Ringkasan nilai penjualan berdasarkan principal.</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right w-[100px]">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const pct = grandTotal > 0 ? ((row.total_value / grandTotal) * 100).toFixed(1) : "0";
                return (
                  <TableRow key={row.principal_name}>
                    <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{row.principal_name}</TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">
                      {row.total_items.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                      Rp {row.total_value.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="blue">{pct}%</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-slate-50/80">
                <TableCell colSpan={2} className="font-bold text-slate-800">Grand Total</TableCell>
                <TableCell className="text-right tabular-nums font-bold text-slate-800">
                  {data.reduce((s, r) => s + r.total_items, 0).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-slate-900">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="emerald">100%</Badge>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   Report 2: Penjualan per Salesman
   ══════════════════════════════════════════════════ */
function SalesmanSalesTable({
  data,
}: {
  data: { salesman_id: string; salesman_name: string; total_value: number; total_orders: number }[];
}) {
  const grandTotal = data.reduce((s, r) => s + r.total_value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>👤</span> Penjualan per Salesman
        </CardTitle>
        <p className="text-sm text-slate-500">Total penjualan dan jumlah order masing-masing salesman.</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead>Salesman</TableHead>
                <TableHead className="text-right">Jumlah Order</TableHead>
                <TableHead className="text-right">Total Penjualan</TableHead>
                <TableHead className="text-right w-[100px]">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const pct = grandTotal > 0 ? ((row.total_value / grandTotal) * 100).toFixed(1) : "0";
                return (
                  <TableRow key={row.salesman_id}>
                    <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-[11px] font-bold text-white">
                          {row.salesman_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{row.salesman_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">
                      {row.total_orders}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                      Rp {row.total_value.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="violet">{pct}%</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-slate-50/80">
                <TableCell colSpan={2} className="font-bold text-slate-800">Grand Total</TableCell>
                <TableCell className="text-right tabular-nums font-bold text-slate-800">
                  {data.reduce((s, r) => s + r.total_orders, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-slate-900">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   Report 3: Outlet Transaksi per Salesman
   ══════════════════════════════════════════════════ */
function SalesmanOutletTable({
  data,
}: {
  data: { salesman_id: string; salesman_name: string; unique_outlet_count: number }[];
}) {
  const totalOutlets = data.reduce((s, r) => s + r.unique_outlet_count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏪</span> Jumlah Outlet Transaksi per Salesman
        </CardTitle>
        <p className="text-sm text-slate-500">
          Outlet unik per salesman. Outlet yang sama di hari yang sama hanya dihitung 1 kali.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead>Salesman</TableHead>
                <TableHead className="text-right">Unique Outlet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={row.salesman_id}>
                  <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[11px] font-bold text-white">
                        {row.salesman_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{row.salesman_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="amber">{row.unique_outlet_count} outlet</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-slate-50/80">
                <TableCell colSpan={2} className="font-bold text-slate-800">Total</TableCell>
                <TableCell className="text-right">
                  <Badge variant="emerald">{totalOutlets} outlet</Badge>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   Report 4: Outlet by Principal by Salesman
   ══════════════════════════════════════════════════ */
function OutletPrincipalSalesmanTable({
  data,
}: {
  data: {
    salesman_id: string;
    salesman_name: string;
    principal_name: string;
    unique_outlet_count: number;
    outlets: string[];
  }[];
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Group by salesman
  const grouped = data.reduce(
    (acc, row) => {
      if (!acc[row.salesman_name]) acc[row.salesman_name] = [];
      acc[row.salesman_name].push(row);
      return acc;
    },
    {} as Record<string, typeof data>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📊</span> Outlet Transaksi by Principal by Salesman
        </CardTitle>
        <p className="text-sm text-slate-500">
          Breakdown outlet per principal per salesman. Klik baris untuk melihat daftar outlet.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([salesmanName, rows]) => {
              const totalOutlets = rows.reduce((s, r) => s + r.unique_outlet_count, 0);

              return (
                <div key={salesmanName} className="overflow-hidden rounded-xl border border-slate-200">
                  {/* Salesman Header */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                        {salesmanName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{salesmanName}</p>
                        <p className="text-[11px] text-slate-400">
                          {rows.length} principal
                        </p>
                      </div>
                    </div>
                    <Badge variant="blue">{totalOutlets} total outlet</Badge>
                  </div>

                  {/* Principal Table */}
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-white">
                        <TableHead className="w-[60px]">No</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead className="text-right">Outlet</TableHead>
                        <TableHead className="text-right w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, idx) => {
                        const rowKey = `${row.salesman_id}_${row.principal_name}`;
                        const isExpanded = expandedRow === rowKey;

                        return (
                          <React.Fragment key={rowKey}>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                            >
                              <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-slate-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🏢</span>
                                  {row.principal_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="blue">{row.unique_outlet_count} outlet</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <svg
                                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Outlet List */}
                            {isExpanded && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="bg-slate-50/70 px-4 py-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {row.outlets.map((outlet, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
                                      >
                                        🏪 {outlet}
                                      </span>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────── Empty State ──────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-sm font-medium text-slate-500">Belum ada data untuk ditampilkan.</p>
      <p className="text-xs text-slate-400 mt-1">Coba ubah filter tanggal atau refresh data.</p>
    </div>
  );
}
