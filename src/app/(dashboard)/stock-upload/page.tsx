"use client";

import React from "react";
import { useStockUpload } from "@/hooks/useStockUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StockUpload() {
  const {
    rows,
    errors,
    missingProducts,
    updatedProducts,
    uploading,
    validRows,
    invalidRows,
    handleFile,
    handleUpload,
  } = useStockUpload();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Stock</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload CSV harian. Kolom yang diterima: product_id + stock, atau kode_produk + qty.
        </p>
      </div>

      {/* Upload Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5 space-y-5">
          {/* File Input */}
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/30">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Pilih file CSV atau drag & drop
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="mx-auto block w-full max-w-xs text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 file:cursor-pointer file:transition-colors"
            />
          </div>

          {/* CSV Format Guide */}
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium mb-2">Format CSV yang diterima:</p>
            <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700 border border-slate-100 font-mono">
              {`kode_produk,qty
434-000-0031,1
434-000-0035,21

atau

product_id,stock
434-000-0031,1
434-000-0035,21`}
            </pre>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryBox title="Total Baris" value={rows.length} icon="📄" />
            <SummaryBox title="Siap Upload" value={validRows.length} icon="✅" color="text-emerald-600" />
            <SummaryBox title="Invalid" value={invalidRows.length} icon="❌" color="text-red-600" danger />
            <SummaryBox title="Tidak Ketemu" value={missingProducts.length} icon="❓" color="text-amber-600" danger />
          </div>

          {/* Alerts */}
          {errors.length > 0 && (
            <AlertBox title="Format CSV salah" items={errors} tone="danger" />
          )}

          {invalidRows.length > 0 && (
            <AlertBox
              title="Baris invalid"
              items={invalidRows.slice(0, 20).map((row) => {
                const label = row.product_id || `Baris ${row.rowNumber}`;
                return `${label}: ${row.errors.join(", ")}`;
              })}
              tone="danger"
            />
          )}

          {missingProducts.length > 0 && (
            <AlertBox
              title="Product tidak ditemukan di table products"
              items={missingProducts.slice(0, 30).map((row) => row.product_id)}
              tone="warning"
            />
          )}

          {updatedProducts.length > 0 && (
            <AlertBox
              title="Stock berhasil diupdate"
              items={updatedProducts.slice(0, 20).map((row) => row.product_id)}
              tone="success"
            />
          )}

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || rows.length === 0 || invalidRows.length > 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/20"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengupload...
              </span>
            ) : "Update Stock"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      {rows.length > 0 && (
        <Card className="border-slate-200 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-sm">Preview Data ({rows.length} baris)</CardTitle>
            <CardDescription>
              {rows.length > 100 && `Menampilkan 100 baris pertama dari ${rows.length} total.`}
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Baris</th>
                  <th className="px-5 py-3">Product ID</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 100).map((row) => (
                  <tr key={`${row.product_id}-${row.rowNumber}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-500">{row.rowNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {row.product_id || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {Number(row.stock || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-600/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {row.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

interface SummaryBoxProps {
  title: string;
  value: number;
  icon?: string;
  color?: string;
  danger?: boolean;
}

function SummaryBox({ title, value, icon, color = "text-slate-900", danger = false }: SummaryBoxProps) {
  return (
    <div className={`rounded-xl border p-3 transition-shadow hover:shadow-sm ${
      danger && value > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50/50"
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        <p className="text-xs font-medium text-slate-500">{title}</p>
      </div>
      <p className={`text-xl font-bold ${danger && value > 0 ? "text-red-600" : color}`}>
        {Number(value || 0).toLocaleString("id-ID")}
      </p>
    </div>
  );
}

interface AlertBoxProps {
  title: string;
  items: string[];
  tone?: "warning" | "danger" | "success";
}

function AlertBox({ title, items, tone = "warning" }: AlertBoxProps) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const iconPath =
    tone === "danger"
      ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      : tone === "success"
        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

  return (
    <div className={`rounded-xl border p-4 text-sm ${toneClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        <p className="font-semibold">{title}</p>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
