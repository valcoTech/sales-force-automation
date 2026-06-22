"use client";

import React, { useCallback, useState } from "react";
import * as XLSX from "xlsx";

interface ExcelUploaderProps {
  /** Label shown on the upload area */
  label: string;
  /** Description text below the label */
  description?: string;
  /** Called with parsed rows (array of objects keyed by header) */
  onData: (rows: Record<string, unknown>[]) => void;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Accept specific sheet name — defaults to first sheet */
  sheetName?: string;
  /** Icon emoji */
  icon?: string;
}

export default function ExcelUploader({
  label,
  description,
  onData,
  loading = false,
  sheetName,
  icon = "📄",
}: ExcelUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = sheetName
          ? wb.Sheets[sheetName]
          : wb.Sheets[wb.SheetNames[0]];
        if (!ws) return;
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });
        setRowCount(jsonRows.length);
        onData(jsonRows);
      };
      reader.readAsArrayBuffer(file);
    },
    [onData, sheetName]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
        dragOver
          ? "border-blue-400 bg-blue-50/60"
          : fileName
            ? "border-emerald-300 bg-emerald-50/40"
            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
      }`}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              Uploading...
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-2xl shadow-sm">
          {fileName ? "✅" : icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          )}
        </div>

        {fileName && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-100/70 px-3 py-1.5">
            <span className="text-xs font-medium text-emerald-700">
              {fileName}
            </span>
            <span className="text-[10px] text-emerald-500">
              ({rowCount.toLocaleString()} rows)
            </span>
          </div>
        )}

        <label className="group cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-150 group-hover:shadow-lg group-hover:shadow-blue-600/30">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {fileName ? "Ganti File" : "Pilih File Excel"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            className="hidden"
          />
        </label>

        <p className="text-[11px] text-slate-400">
          Drag & drop atau klik untuk upload file .xlsx / .xls / .csv
        </p>
      </div>
    </div>
  );
}
