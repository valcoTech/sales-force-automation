import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export interface CsvRow {
  rowNumber: number;
  product_id: string;
  stock: number;
  stockText: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

const PRODUCT_ID_KEYS = ["product_id", "kode_produk", "kode product", "kode"];
const STOCK_KEYS = ["stock", "qty", "stok"];

const normalizeHeader = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
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

const findHeaderKey = (headers: string[], keys: string[]): string | undefined =>
  headers.find((header) => keys.includes(header));

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export function useStockUpload() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [missingProducts, setMissingProducts] = useState<CsvRow[]>([]);
  const [updatedProducts, setUpdatedProducts] = useState<CsvRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const validRows = useMemo(
    () => rows.filter((row) => row.isValid && !row.isDuplicate),
    [rows]
  );

  const invalidRows = useMemo(
    () => rows.filter((row) => !row.isValid || row.isDuplicate),
    [rows]
  );

  const parseCsv = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, "").trim();

    if (!cleanText) {
      return {
        parsedRows: [],
        parseErrors: ["File CSV kosong"],
      };
    }

    const lines = cleanText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      return {
        parsedRows: [],
        parseErrors: ["File CSV kosong"],
      };
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const productIdKey = findHeaderKey(headers, PRODUCT_ID_KEYS);
    const stockKey = findHeaderKey(headers, STOCK_KEYS);
    const parseErrors: string[] = [];

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

    const seenProductIds = new Set<string>();
    const duplicateProductIds = new Set<string>();

    const mappedRows: CsvRow[] = lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line);
      const raw = headers.reduce((obj, header, headerIndex) => {
        obj[header] = values[headerIndex] ?? "";
        return obj;
      }, {} as Record<string, string>);

      const productId = String(raw[productIdKey!] || "").trim();
      const stockText = String(raw[stockKey!] || "").trim();
      const stock = Number(stockText);
      const rowErrors: string[] = [];

      if (!productId) {
        rowErrors.push("Product ID kosong");
      }

      if (!stockText) {
        rowErrors.push("Stock kosong");
      } else if (!Number.isFinite(stock) || stock < 0) {
        rowErrors.push("Stock harus angka dan tidak boleh minus");
      }

      if (productId && seenProductIds.has(productId)) {
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
          new Set([...row.errors, "Product ID duplikat di CSV"])
        ),
      };
    });

    return {
      parsedRows,
      parseErrors,
    };
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
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
    } catch (err) {
      console.error(err);
      toast.error("Gagal membaca file");
    }
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
    const existingProducts: { product_id: string }[] = [];

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
      existingProducts.map((product) => product.product_id)
    );

    const foundRows = validRows.filter((row) =>
      existingProductIds.has(row.product_id)
    );

    const notFoundRows = validRows.filter(
      (row) => !existingProductIds.has(row.product_id)
    );

    setMissingProducts(notFoundRows);

    if (foundRows.length === 0) {
      toast.error("Tidak ada product_id yang cocok dengan database");
      setUploading(false);
      return;
    }

    const failedRows: CsvRow[] = [];
    const successRows: CsvRow[] = [];

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
        `${successRows.length} stock update, ${notFoundRows.length} product tidak ditemukan`
      );
      return;
    }

    toast.success(`${successRows.length} stock berhasil diupdate`);
  };

  return {
    rows,
    errors,
    missingProducts,
    updatedProducts,
    uploading,
    validRows,
    invalidRows,
    handleFile,
    handleUpload,
  };
}
