import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";

const PRODUCT_ID_KEYS = ["product_id", "kode_produk", "kode product", "kode"];
const STOCK_KEYS = ["stock", "qty", "stok"];

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let insideQuote = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const findHeaderKey = (headers, keys) =>
  headers.find((header) => keys.includes(header));

const chunkArray = (array, size) => {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
};

export default function StockUpload() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [missingProducts, setMissingProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState([]);
  const [uploading, setUploading] = useState(false);

  const validRows = useMemo(
    () => rows.filter((row) => row.isValid && !row.isDuplicate),
    [rows],
  );

  const invalidRows = useMemo(
    () => rows.filter((row) => !row.isValid || row.isDuplicate),
    [rows],
  );

  const parseCsv = (text) => {
    const cleanText = text.replace(/^\uFEFF/, "").trim();

    if (!cleanText) {
      return {
        parsedRows: [],
        parseErrors: ["File CSV kosong"],
      };
    }

    const lines = cleanText.split(/\r?\n/).filter(Boolean);
    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const productIdKey = findHeaderKey(headers, PRODUCT_ID_KEYS);
    const stockKey = findHeaderKey(headers, STOCK_KEYS);
    const parseErrors = [];

    if (!productIdKey) {
      parseErrors.push("Kolom product_id / kode_produk tidak ditemukan");
    }

    if (!stockKey) {
      parseErrors.push("Kolom stock / qty tidak ditemukan");
    }

    if (parseErrors.length > 0) {
      return {
        parsedRows: [],
        parseErrors,
      };
    }

    const seenProductIds = new Set();
    const duplicateProductIds = new Set();

    const mappedRows = lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line);
      const raw = headers.reduce((obj, header, headerIndex) => {
        obj[header] = values[headerIndex] ?? "";
        return obj;
      }, {});

      const productId = String(raw[productIdKey] || "").trim();
      const stockText = String(raw[stockKey] || "").trim();
      const stock = Number(stockText);
      const rowErrors = [];

      if (!productId) {
        rowErrors.push("Product ID kosong");
      }

      if (!stockText) {
        rowErrors.push("Stock kosong");
      } else if (!Number.isFinite(stock) || stock < 0) {
        rowErrors.push("Stock harus angka dan tidak boleh minus");
      }

      if (seenProductIds.has(productId)) {
        duplicateProductIds.add(productId);
        rowErrors.push("Product ID duplikat di CSV");
      }

      if (productId) {
        seenProductIds.add(productId);
      }

      return {
        rowNumber: index + 2,
        product_id: productId,
        stock: Number.isFinite(stock) ? stock : 0,
        stockText,
        isValid: rowErrors.length === 0,
        isDuplicate: false,
        errors: rowErrors,
      };
    });

    const parsedRows = mappedRows.map((row) => {
      if (!duplicateProductIds.has(row.product_id)) return row;

      return {
        ...row,
        isDuplicate: true,
        isValid: false,
        errors: Array.from(
          new Set([...row.errors, "Product ID duplikat di CSV"]),
        ),
      };
    });

    return {
      parsedRows,
      parseErrors,
    };
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const { parsedRows, parseErrors } = parseCsv(text);

    setRows(parsedRows);
    setErrors(parseErrors);
    setMissingProducts([]);
    setUpdatedProducts([]);

    if (parseErrors.length > 0) {
      toast.error("Format CSV belum sesuai");
      return;
    }

    if (parsedRows.length === 0) {
      toast.error("CSV tidak memiliki data stock");
      return;
    }

    if (parsedRows.some((row) => !row.isValid)) {
      toast.error("Ada baris CSV yang perlu diperbaiki");
      return;
    }

    toast.success(`${parsedRows.length} baris stock siap diupload`);
  };

  const handleUpload = async () => {
    if (rows.length === 0) {
      toast.error("Pilih file CSV dulu");
      return;
    }

    if (errors.length > 0 || invalidRows.length > 0) {
      toast.error("Perbaiki data CSV dulu sebelum upload");
      return;
    }

    setUploading(true);
    setMissingProducts([]);
    setUpdatedProducts([]);

    const productIds = validRows.map((row) => row.product_id);
    const existingProducts = [];

    for (const productIdChunk of chunkArray(productIds, 25)) {
      const { data, error } = await supabase
        .from("products")
        .select("product_id")
        .in("product_id", productIdChunk);

      if (error) {
        console.error(error);
        toast.error("Gagal validasi product di database");
        setUploading(false);
        return;
      }

      existingProducts.push(...(data || []));
    }

    const existingProductIds = new Set(
      existingProducts.map((product) => product.product_id),
    );

    const foundRows = validRows.filter((row) =>
      existingProductIds.has(row.product_id),
    );

    const notFoundRows = validRows.filter(
      (row) => !existingProductIds.has(row.product_id),
    );

    setMissingProducts(notFoundRows);

    if (foundRows.length === 0) {
      toast.error("Tidak ada product_id yang cocok dengan database");
      setUploading(false);
      return;
    }

    const failedRows = [];
    const successRows = [];

    for (const rowChunk of chunkArray(foundRows, 100)) {
      const updatePayload = rowChunk.map((row) => ({
        product_id: row.product_id,
        stock: row.stock,
      }));

      const { error } = await supabase.from("products").upsert(updatePayload, {
        onConflict: "product_id",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(error);
        failedRows.push(...rowChunk);
      } else {
        successRows.push(...rowChunk);
      }
    }

    setUpdatedProducts(successRows);
    setUploading(false);

    if (failedRows.length > 0) {
      toast.error(`${failedRows.length} stock gagal diupdate`);
      return;
    }

    if (notFoundRows.length > 0) {
      toast.success(
        `${successRows.length} stock update, ${notFoundRows.length} product tidak ditemukan`,
      );
      return;
    }

    toast.success(`${successRows.length} stock berhasil diupdate`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Stock</h1>
          <p className="text-sm text-gray-500">
            Upload CSV harian. Kolom yang diterima: product_id + stock, atau
            kode_produk + qty.
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
            Format CSV yang bisa dipakai:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs">
              {`kode_produk,qty
434-000-0031,1
434-000-0035,21

atau

product_id,stock
434-000-0031,1
434-000-0035,21`}
            </pre>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <SummaryBox title="Total Baris" value={rows.length} />
            <SummaryBox title="Siap Upload" value={validRows.length} />
            <SummaryBox title="Invalid" value={invalidRows.length} danger />
            <SummaryBox
              title="Tidak Ketemu"
              value={missingProducts.length}
              danger
            />
          </div>

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

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || rows.length === 0 || invalidRows.length > 0}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? "Mengupload..." : "Update Stock"}
          </button>
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Baris</th>
                  <th className="px-4 py-3">Product ID</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 100).map((row) => (
                  <tr key={`${row.product_id}-${row.rowNumber}`}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3 font-medium">
                      {row.product_id || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {Number(row.stock || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Valid
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          {row.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length > 100 && (
              <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                Preview hanya menampilkan 100 baris pertama dari {rows.length}{" "}
                baris.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryBox({ title, value, danger = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {Number(value || 0).toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function AlertBox({ title, items, tone = "warning" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-yellow-200 bg-yellow-50 text-yellow-700";

  return (
    <div className={`mt-4 rounded-xl border p-4 text-sm ${toneClass}`}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
