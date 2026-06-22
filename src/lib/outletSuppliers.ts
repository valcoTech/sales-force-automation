/**
 * Supplier list for Outlet Transaksi check pages.
 *
 * This is SEPARATE from principalGroups.ts (used for incentive calculations).
 * Contains the exact supplier_name values as stored in raw_data.
 */

export const OUTLET_SUPPLIERS = [
  "DANPAC PHARMA. PT",
  "PAN PACIFIC DEVELOPMENT PT",
  "ERLANGGA EDI LABORATORIES (ERELA). PT",
  "PT MULIA PUTRA MANDIRI",
  "PT MULIA PUTRA MANDIRI (GT)",
  "AULIA COSMETIC INDONESIA. PT",
  "LAPI LABORATORIES. PT",
  "LAPI LABORATORIES. PT (OTC)",
  "MARION SAM. PT",
  "MARTINA BERTO TBK .PT",
  "OMRON HEALTHCARE INDONESIA .PT",
  "KEBAYORAN PHARMA. PT",
  "PT SEKAWAN KOSMETIK WASANTARA",
  "PT. BORDEN EAGLE INDONESIA",
  "SURYA DERMATO MEDICA. PT (OTC)",
  "SIMEX PHARMACEUTICAL IND. PT (OTC)",
  "TEGUHSINDO LESTARITAMA. PT",
  "UNICHARM TRADING INDONESIA .PT",
] as const;

export type OutletSupplierName = (typeof OUTLET_SUPPLIERS)[number];

/**
 * Check if a supplier_name matches one of the known outlet suppliers.
 * Uses case-insensitive trimmed comparison.
 */
export function matchOutletSupplier(
  supplierName: string | null | undefined
): string | null {
  if (!supplierName) return null;
  const upper = supplierName.toUpperCase().trim();

  for (const s of OUTLET_SUPPLIERS) {
    if (upper === s.toUpperCase().trim()) {
      return s;
    }
  }
  return null;
}
