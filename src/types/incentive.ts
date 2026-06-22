// TypeScript types for Incentive Salesman feature

export interface RawData {
  id: number;
  division: string | null;
  ar_date: string | null;
  cust_ship_id: string | null;
  cust_ship_name: string | null;
  ar_slsm_name: string | null;
  principal_id: string | null;
  supplier_name: string | null;
  prod_id: string | null;
  prod_name: string | null;
  prod_uom_id: string | null;
  unit_list_price: number;
  gs_qty: number;
  gs_value: number;
  bln: string | null;
  month: string | null;
  year: number | null;
  created_at: string;
  uploaded_by: string | null;
}

export interface IncentiveTarget {
  id: number;
  salesman_name: string;
  principal_group: string;
  target_value: number;
  bln: string;
  year: number;
  created_at: string;
  uploaded_by: string | null;
}

export interface IncentiveTargetOutlet {
  id: number;
  salesman_name: string;
  principal_group: string;
  target_outlet: number;
  total_outlet: number;
  bln: string;
  year: number;
  created_at: string;
  uploaded_by: string | null;
}

export interface IncentiveNewPrincipalTarget {
  id: number;
  salesman_name: string;
  principal_group: string;
  target_value: number;
  bln: string;
  year: number;
  created_at: string;
  uploaded_by: string | null;
}

export interface IncentiveRewardTier {
  id: number;
  incentive_type: "sales" | "new_principal" | "outlet";
  tier_name: string;
  min_pct: number | null;
  max_pct: number | null;
  min_outlet: number | null;
  reward_amount: number;
  is_active: boolean;
  created_at: string;
}

// ---- Calculated result types ----

export interface PrincipalIncentiveRow {
  principal_group: string;
  target: number;
  actual: number;
  achv_pct: number;
  con_pct: number;
  incentive: number;
}

export interface IncentiveSalesResult {
  salesman_name: string;
  bln: string;
  year: number;
  rows: PrincipalIncentiveRow[];
  total_target: number;
  total_actual: number;
  total_achv_pct: number;
  total_incentive: number;
  reward_tiers: { tier_name: string; amount: number }[];
}

export interface OutletPrincipalRow {
  principal_group: string;
  target_outlet: number;
  actual_outlet: number;
  incentive: number;
}

export interface IncentiveOutletResult {
  salesman_name: string;
  bln: string;
  year: number;
  total_outlet_owned: number;
  total_all_ot_target: number;
  rows: OutletPrincipalRow[];
  total_actual_outlet: number;
  total_incentive: number;
  outlet_tier_reward: number;
  outlet_tier_name: string;
}

export type PrincipalGroupKey =
  | "DANPAC PHARMA. PT"
  | "PT MULIA PUTRA MANDIRI"
  | "AULIA COSMETIC INDONESIA. PT"
  | "MARTINA BERTO TBK .PT"
  | "SURYA DERMATO MEDICA. PT (OTC)"
  | "UNICHARM TRADING INDONESIA .PT"
  | "OTHERS";
