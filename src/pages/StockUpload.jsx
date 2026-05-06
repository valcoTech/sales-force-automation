import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";

export default function StockUpload() {
  const [rows, setRows] = useState([]);
  const [uploading, setUploading] = useState(false);

  const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsedRows = parseCsv(text);

    setRows(parsedRows);
  };

  const handleUpload = async () => {
    if (rows.length === 0) {
      toast.error("Pilih file CSV dulu");
      return;
    }

    setUploading(true);

    for (const row of rows) {
      const productId = row.product_id;
      const stock = Number(row.stock || 0);

      if (!productId) continue;

      const { error } = await supabase
        .from("products")
        .update({ stock })
        .eq("product_id", productId);

      if (error) {
        console.error(error);
        toast.error(`Gagal update ${productId}`);
        setUploading(false);
        return;
      }
    }

    toast.success("Stock berhasil diupdate");
    setUploading(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Stock</h1>
          <p className="text-sm text-gray-500">
            Upload CSV harian dengan kolom product_id dan stock.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />

          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            Format CSV:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs">
              {`product_id,stock
BRG001,120
BRG002,45`}
            </pre>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || rows.length === 0}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {uploading ? "Mengupload..." : "Update Stock"}
          </button>
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product ID</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, index) => (
                  <tr key={`${row.product_id}-${index}`}>
                    <td className="px-4 py-3">{row.product_id}</td>
                    <td className="px-4 py-3">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
