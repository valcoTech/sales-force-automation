/**
 * Incentive Calculation Engine
 *
 * Three types of incentive:
 * 1. Incentive Sales — based on achievement vs target per principal by salesman
 * 2. Incentive New Principal — same structure, different principal list & reward tiers
 * 3. Incentive Outlet Transaksi — unique outlet count per principal
 */

import type {
  RawData,
  IncentiveTarget,
  IncentiveTargetOutlet,
  IncentiveNewPrincipalTarget,
  PrincipalIncentiveRow,
  IncentiveSalesResult,
  OutletPrincipalRow,
  IncentiveOutletResult,
} from "@/types/incentive";
import { mapToPrincipalGroup, PRINCIPAL_GROUPS } from "./principalGroups";

// ─── Helper: format number with IDR ────────────────────────────────
export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Helper: percent format ────────────────────────────────────────
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ─── Sales Incentive Reward Tiers (hardcoded defaults) ─────────────
const SALES_TIERS = [
  { name: "85% - < 95%", min: 85, max: 94.99, amount: 1_200_000 },
  { name: "96% - ≤ 100%", min: 96, max: 100, amount: 2_000_000 },
  { name: "> 100%", min: 100.01, max: 9999, amount: 2_500_000 },
];

const NEW_PRINCIPAL_TIERS = [
  { name: "85% - < 95%", min: 85, max: 94.99, amount: 250_000 },
  { name: "96% - ≤ 100%", min: 96, max: 100, amount: 500_000 },
  { name: "> 100%", min: 100.01, max: 9999, amount: 1_000_000 },
];

const OUTLET_PRINCIPAL_TIERS = [
  { name: "150 OUTLET TRANSAKSI", min: 150, amount: 400_000 },
  { name: "110 OUTLET TRANSAKSI", min: 110, amount: 240_000 },
  { name: "90 OUTLET TRANSAKSI", min: 90, amount: 200_000 },
];

/** Per OT Principal: penalty when actual transaksi < 90 */
export const OUTLET_PRINCIPAL_PENALTY = -20_000;
/** TOTAL ALL OT: penalty when total unique outlet < 90 */
export const OUTLET_TOTAL_PENALTY = -100_000;

/** Reference grid — baris total (Excel row 1 & 3) */
export const OUTLET_TOTAL_REFERENCE_TIERS = [
  { label: "90 OUTLET TRANSAKSI", amount: 1_000_000 },
  { label: "110 OUTLET TRANSAKSI", amount: 1_200_000 },
  { label: "150 OUTLET TRANSAKSI", amount: 2_000_000 },
  { label: "< 90 OUTLET", amount: OUTLET_TOTAL_PENALTY },
];

/** Reference grid — baris per OT Principal (Excel row 2) */
export const OUTLET_PRINCIPAL_REFERENCE_TIERS = [
  { label: "90 OUTLET TRANSAKSI", amount: 200_000 },
  { label: "110 OUTLET TRANSAKSI", amount: 240_000 },
  { label: "150 OUTLET TRANSAKSI", amount: 400_000 },
  { label: "< 90 OUTLET", amount: OUTLET_PRINCIPAL_PENALTY },
];

const TOTAL_ALL_OT_KEY = "TOTAL ALL OT";

function hasOutletTransaction(row: RawData): boolean {
  return Boolean(row.cust_ship_id) && (Number(row.gs_value) || 0) > 0;
}

function getOutletIncentiveForCount(
  count: number,
  tiers: typeof OUTLET_PRINCIPAL_TIERS,
  belowMinPenalty: number
): { amount: number; tierName: string } {
  for (const tier of tiers) {
    if (count >= tier.min) {
      return { amount: tier.amount, tierName: tier.name };
    }
  }
  return { amount: belowMinPenalty, tierName: "< 90 OUTLET" };
}

function getRewardForAchievement(
  achvPct: number,
  tiers: typeof SALES_TIERS
): number {
  for (const tier of tiers) {
    if (achvPct >= tier.min && achvPct <= tier.max) {
      return tier.amount;
    }
  }
  return 0;
}

// ─── 1. Calculate Incentive Sales ──────────────────────────────────
export function calculateIncentiveSales(
  rawData: RawData[],
  targets: IncentiveTarget[],
  salesmanName: string,
  bln: string,
  year: number
): IncentiveSalesResult {
  // Filter raw data for this salesman & period
  const filtered = rawData.filter(
    (r) =>
      r.ar_slsm_name?.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      r.bln === bln &&
      r.year === year
  );

  // Group actual values by principal group
  const actualByGroup: Record<string, number> = {};
  for (const row of filtered) {
    const group = mapToPrincipalGroup(row.supplier_name);
    actualByGroup[group] = (actualByGroup[group] || 0) + (Number(row.gs_value) || 0);
  }

  // Build target map
  const targetMap: Record<string, number> = {};
  const filteredTargets = targets.filter(
    (t) =>
      t.salesman_name.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      t.bln === bln &&
      t.year === year
  );
  for (const t of filteredTargets) {
    targetMap[t.principal_group] = Number(t.target_value) || 0;
  }

  // Calculate total target for CON.%
  const totalTarget = Object.values(targetMap).reduce((s, v) => s + v, 0);
  const totalActual = Object.values(actualByGroup).reduce((s, v) => s + v, 0);
  const overallAchvPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Build rows for each principal group (use ordered groups)
  const rows: PrincipalIncentiveRow[] = [];
  for (const group of PRINCIPAL_GROUPS) {
    const target = targetMap[group] || 0;
    const actual = actualByGroup[group] || 0;
    // Only show groups that have target or actual
    if (target === 0 && actual === 0) continue;

    const achvPct = target > 0 ? (actual / target) * 100 : 0;
    const conPct = totalTarget > 0 ? (target / totalTarget) * 100 : 0;
    // Each principal uses its own ACHV% to determine the reward tier
    const rowReward = getRewardForAchievement(achvPct, SALES_TIERS);
    const incentive = (conPct / 100) * rowReward;

    rows.push({
      principal_group: group,
      target,
      actual,
      achv_pct: achvPct,
      con_pct: conPct,
      incentive: Math.round(incentive),
    });
  }

  return {
    salesman_name: salesmanName,
    bln,
    year,
    rows,
    total_target: totalTarget,
    total_actual: totalActual,
    total_achv_pct: overallAchvPct,
    total_incentive: rows.reduce((s, r) => s + r.incentive, 0),
    reward_tiers: SALES_TIERS.map((t) => ({ tier_name: t.name, amount: t.amount })),
  };
}

// ─── 2. Calculate Incentive New Principal ──────────────────────────
export function calculateIncentiveNewPrincipal(
  rawData: RawData[],
  targets: IncentiveNewPrincipalTarget[],
  salesmanName: string,
  bln: string,
  year: number
): IncentiveSalesResult {
  // Filter raw data for this salesman & period
  const filtered = rawData.filter(
    (r) =>
      r.ar_slsm_name?.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      r.bln === bln &&
      r.year === year
  );

  // Get the new principal groups from targets (dynamic, can change per period)
  const filteredTargets = targets.filter(
    (t) =>
      t.salesman_name.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      t.bln === bln &&
      t.year === year
  );

  const targetMap: Record<string, number> = {};
  for (const t of filteredTargets) {
    targetMap[t.principal_group] = Number(t.target_value) || 0;
  }

  // Actual values — match supplier_name to new principal target groups.
  // Uses multiple strategies to handle name variations and typos:
  //   1. Bidirectional includes (supplier⊇target OR target⊇supplier)
  //   2. Normalized keyword matching (strip PT/PT./commas, compare core words)
  const actualByGroup: Record<string, number> = {};

  /** Normalize a company name for fuzzy comparison: strip common prefixes, punctuation */
  function normalizeForMatch(name: string): string {
    return name
      .toUpperCase()
      .replace(/[.,()]/g, " ")
      .replace(/\bPT\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Check if two company names likely refer to the same entity */
  function isSupplierMatch(supplier: string, targetGroup: string): boolean {
    const supUpper = supplier.toUpperCase().trim();
    const tgtUpper = targetGroup.toUpperCase().trim();

    // Strategy 1: bidirectional includes
    if (supUpper.includes(tgtUpper) || tgtUpper.includes(supUpper)) {
      return true;
    }

    // Strategy 2: normalized keyword matching — check if core words overlap
    const supNorm = normalizeForMatch(supplier);
    const tgtNorm = normalizeForMatch(targetGroup);
    if (supNorm.includes(tgtNorm) || tgtNorm.includes(supNorm)) {
      return true;
    }

    // Strategy 3: word-set overlap — if ≥ 2 significant words match
    const supWords = supNorm.split(" ").filter((w) => w.length > 2);
    const tgtWords = tgtNorm.split(" ").filter((w) => w.length > 2);
    if (supWords.length > 0 && tgtWords.length > 0) {
      const matchCount = tgtWords.filter((w) => supWords.includes(w)).length;
      if (matchCount >= 2 && matchCount >= tgtWords.length * 0.6) {
        return true;
      }
    }

    return false;
  }

  for (const row of filtered) {
    const supplierName = (row.supplier_name || "").trim();
    // Check against each new principal target
    for (const pg of Object.keys(targetMap)) {
      if (isSupplierMatch(supplierName, pg)) {
        actualByGroup[pg] = (actualByGroup[pg] || 0) + (Number(row.gs_value) || 0);
        break;
      }
    }
  }

  const totalTarget = Object.values(targetMap).reduce((s, v) => s + v, 0);
  const totalActual = Object.values(actualByGroup).reduce((s, v) => s + v, 0);
  const overallAchvPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const allGroups = Object.keys(targetMap);
  const rows: PrincipalIncentiveRow[] = [];

  for (const group of allGroups) {
    const target = targetMap[group] || 0;
    const actual = actualByGroup[group] || 0;
    const achvPct = target > 0 ? (actual / target) * 100 : 0;
    const conPct = totalTarget > 0 ? (target / totalTarget) * 100 : 0;
    const rowReward = getRewardForAchievement(achvPct, NEW_PRINCIPAL_TIERS);
    const incentive = (conPct / 100) * rowReward;

    rows.push({
      principal_group: group,
      target,
      actual,
      achv_pct: achvPct,
      con_pct: conPct,
      incentive: Math.round(incentive),
    });
  }

  return {
    salesman_name: salesmanName,
    bln,
    year,
    rows,
    total_target: totalTarget,
    total_actual: totalActual,
    total_achv_pct: overallAchvPct,
    total_incentive: rows.reduce((s, r) => s + r.incentive, 0),
    reward_tiers: NEW_PRINCIPAL_TIERS.map((t) => ({
      tier_name: t.name,
      amount: t.amount,
    })),
  };
}

// ─── 3. Calculate Incentive Outlet Transaksi ───────────────────────
export function calculateIncentiveOutlet(
  rawData: RawData[],
  targetOutlets: IncentiveTargetOutlet[],
  salesmanName: string,
  bln: string,
  year: number
): IncentiveOutletResult {
  // Filter raw data for this salesman & period
  const filtered = rawData.filter(
    (r) =>
      r.ar_slsm_name?.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      r.bln === bln &&
      r.year === year
  );

  // Get target outlets
  const filteredTargets = targetOutlets.filter(
    (t) =>
      t.salesman_name.toUpperCase().trim() ===
        salesmanName.toUpperCase().trim() &&
      t.bln === bln &&
      t.year === year
  );

  const targetMap: Record<string, { target: number; totalOwned: number }> = {};
  let totalAllOtTarget = 90;
  let totalOutletOwned = 0;

  for (const t of filteredTargets) {
    if (t.principal_group.toUpperCase().trim() === TOTAL_ALL_OT_KEY) {
      totalAllOtTarget = t.target_outlet;
      totalOutletOwned = Math.max(totalOutletOwned, t.total_outlet);
      continue;
    }
    targetMap[t.principal_group] = {
      target: t.target_outlet,
      totalOwned: t.total_outlet,
    };
    totalOutletOwned = Math.max(totalOutletOwned, t.total_outlet);
  }

  // Count UNIQUE outlets per SUPPLIER (by cust_ship_id), then SUM per group.
  // This ensures that if an outlet buys from both "PT MULIA PUTRA MANDIRI"
  // and "PT MULIA PUTRA MANDIRI (GT)", it is counted once per supplier,
  // and the group total is the sum of unique outlets across its suppliers.
  // Only positive GS value rows count as outlet transactions.
  const outletIdsBySupplier: Record<string, Record<string, Set<string>>> = {};
  // outletIdsBySupplier[group][supplierName] = Set<cust_ship_id>
  for (const row of filtered) {
    if (!hasOutletTransaction(row)) continue;

    const group = mapToPrincipalGroup(row.supplier_name);
    if (targetMap[group]) {
      const supplierKey = (row.supplier_name || "").trim();
      if (!outletIdsBySupplier[group]) {
        outletIdsBySupplier[group] = {};
      }
      if (!outletIdsBySupplier[group][supplierKey]) {
        outletIdsBySupplier[group][supplierKey] = new Set();
      }
      outletIdsBySupplier[group][supplierKey].add(String(row.cust_ship_id).trim());
    }
  }

  // Helper: sum unique outlet counts per supplier for a group
  function getGroupOutletCount(group: string): number {
    const suppliers = outletIdsBySupplier[group];
    if (!suppliers) return 0;
    let total = 0;
    for (const supplierSet of Object.values(suppliers)) {
      total += supplierSet.size;
    }
    return total;
  }

  // Total unique outlets across ALL principals (deduplicated)
  const allUniqueOutlets = new Set<string>();
  for (const row of filtered) {
    if (hasOutletTransaction(row)) {
      allUniqueOutlets.add(String(row.cust_ship_id).trim());
    }
  }

  const rows: OutletPrincipalRow[] = [];
  for (const group of Object.keys(targetMap)) {
    const target = targetMap[group].target;
    const actual = getGroupOutletCount(group);
    const { amount: incentive } = getOutletIncentiveForCount(
      actual,

      OUTLET_PRINCIPAL_TIERS,
      OUTLET_PRINCIPAL_PENALTY
    );
    rows.push({
      principal_group: group,
      target_outlet: target,
      actual_outlet: actual,
      incentive,
    });
  }

  const totalActualOutlet = allUniqueOutlets.size;
  const totalTier = getOutletIncentiveForCount(
    totalActualOutlet,
    OUTLET_PRINCIPAL_TIERS,
    OUTLET_TOTAL_PENALTY
  );

  const principalIncentiveSum = rows.reduce((s, r) => s + r.incentive, 0);

  return {
    salesman_name: salesmanName,
    bln,
    year,
    total_outlet_owned: totalOutletOwned,
    total_all_ot_target: totalAllOtTarget,
    rows,
    total_actual_outlet: totalActualOutlet,
    total_incentive: principalIncentiveSum + totalTier.amount,
    outlet_tier_reward: totalTier.amount,
    outlet_tier_name: totalTier.tierName,
  };
}

// ─── Get unique salesman names from raw_data ───────────────────────
export function getUniqueSalesmanNames(rawData: RawData[]): string[] {
  const names = new Set<string>();
  for (const row of rawData) {
    if (row.ar_slsm_name) {
      names.add(row.ar_slsm_name.trim());
    }
  }
  return Array.from(names).sort();
}

// ─── Month chronological order mapping ──────────────────────────────
const MONTH_ORDER: Record<string, number> = {
  january: 1, jan: 1, januari: 1,
  february: 2, feb: 2, februari: 2,
  march: 3, mar: 3, maret: 3,
  april: 4, apr: 4,
  may: 5, mei: 5,
  june: 6, jun: 6, juni: 6,
  july: 7, jul: 7, juli: 7,
  august: 8, aug: 8, agustus: 8,
  september: 9, sep: 9,
  october: 10, oct: 10, oktober: 10,
  november: 11, nov: 11,
  december: 12, dec: 12, desember: 12
};

function getMonthIndex(monthStr: string): number {
  if (!monthStr) return 0;
  const normalized = monthStr.toLowerCase().trim();
  return MONTH_ORDER[normalized] || 0;
}

// ─── Get unique periods from raw_data ──────────────────────────────
export function getUniquePeriods(
  rawData: RawData[]
): { bln: string; month: string; year: number }[] {
  const map = new Map<string, { bln: string; month: string; year: number }>();
  for (const row of rawData) {
    if (row.bln && row.year) {
      const key = `${row.bln}-${row.year}`;
      if (!map.has(key)) {
        map.set(key, {
          bln: row.bln,
          month: row.month || row.bln,
          year: row.year,
        });
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.year - b.year || getMonthIndex(a.bln) - getMonthIndex(b.bln)
  );
}
