/**
 * Principal grouping utility for Incentive calculations.
 *
 * Maps raw `supplier_name` from raw_data to standardised principal groups.
 * PT MULIA PUTRA MANDIRI is a merge of "PT. MULIA PUTRA MANDIRI" and "PT. MULIA PUTRA MANDIRI (GT)".
 */

import type { PrincipalGroupKey } from "@/types/incentive";

/** Ordered list of recognised principal groups (excl. OTHERS). */
export const PRINCIPAL_GROUPS: PrincipalGroupKey[] = [
  "DANPAC PHARMA. PT",
  "PT MULIA PUTRA MANDIRI",
  "AULIA COSMETIC INDONESIA. PT",
  "MARTINA BERTO TBK .PT",
  "SURYA DERMATO MEDICA. PT (OTC)",
  "UNICHARM TRADING INDONESIA .PT",
  "OTHERS",
];

// Matching rules — key = principal group, value = list of patterns to test
// Uses startsWith for prefix matching
const PRINCIPAL_PATTERNS: Record<string, string[]> = {
  "DANPAC PHARMA. PT": ["DANPAC PHARMA"],
  "PT MULIA PUTRA MANDIRI": [
    "PT. MULIA PUTRA MANDIRI",
    "PT MULIA PUTRA MANDIRI",
    "PT MULIA MANDIRI",
  ],
  "AULIA COSMETIC INDONESIA. PT": ["AULIA COSMETIC"],
  "MARTINA BERTO TBK .PT": ["MARTINA BERTO"],
  "SURYA DERMATO MEDICA. PT (OTC)": ["SURYA DERMATO"],
  "UNICHARM TRADING INDONESIA .PT": ["UNICHARM"],
};

/**
 * Resolve a supplier_name from raw_data into a principal group key.
 * Returns "OTHERS" if no match found.
 */
export function mapToPrincipalGroup(
  supplierName: string | null | undefined
): PrincipalGroupKey {
  if (!supplierName) return "OTHERS";
  const upper = supplierName.toUpperCase().trim();

  for (const [group, patterns] of Object.entries(PRINCIPAL_PATTERNS)) {
    for (const pat of patterns) {
      if (upper.includes(pat.toUpperCase())) {
        return group as PrincipalGroupKey;
      }
    }
  }

  return "OTHERS";
}

/**
 * Check if a supplier_name belongs to one of the known principal groups (not OTHERS).
 */
export function isKnownPrincipal(
  supplierName: string | null | undefined
): boolean {
  return mapToPrincipalGroup(supplierName) !== "OTHERS";
}
