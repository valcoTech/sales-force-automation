import { supabase } from "@/lib/supabase";
import type {
  RawData,
  IncentiveTarget,
  IncentiveTargetOutlet,
  IncentiveNewPrincipalTarget,
} from "@/types/incentive";
import { getUniquePeriods, getUniqueSalesmanNames } from "@/lib/incentiveCalculation";

const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export interface IncentiveFilters {
  periods: { bln: string; month: string; year: number }[];
  salesmen: string[];
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sesi login tidak ditemukan");
  }
  return session.access_token;
}

async function fetchAllPages<T>(
  queryFn: (from: number, to: number) => Promise<PageResult<T>>
): Promise<T[]> {
  const all: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await queryFn(from, to);
    if (error) throw new Error(error.message);

    const rows = data || [];
    all.push(...rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return all;
}

/** Load filter options via API (Redis cache + fast DB RPC). */
async function loadFiltersFromRpc(): Promise<IncentiveFilters> {
  const [periodsRes, salesmenRes] = await Promise.all([
    supabase.rpc("get_incentive_periods"),
    supabase.rpc("get_incentive_salesmen"),
  ]);

  if (periodsRes.error) throw new Error(periodsRes.error.message);
  if (salesmenRes.error) throw new Error(salesmenRes.error.message);

  const periodRows = (periodsRes.data || []) as Pick<
    RawData,
    "bln" | "month" | "year"
  >[];
  const salesmenRows = (salesmenRes.data || []) as { salesman_name: string }[];

  return {
    periods: getUniquePeriods(periodRows as RawData[]),
    salesmen: salesmenRows
      .map((r) => r.salesman_name?.trim())
      .filter(Boolean) as string[],
  };
}

/** Fallback when RPC is not deployed yet — paginated scan (slow). */
async function loadFiltersPaginated(): Promise<IncentiveFilters> {
  const [periodRows, salesmanRows] = await Promise.all([
    fetchAllPages<Pick<RawData, "bln" | "month" | "year">>(async (from, to) =>
      supabase
        .from("raw_data")
        .select("bln, month, year")
        .order("year")
        .order("bln")
        .range(from, to)
    ),
    fetchAllPages<Pick<RawData, "ar_slsm_name">>(async (from, to) =>
      supabase
        .from("raw_data")
        .select("ar_slsm_name")
        .order("ar_slsm_name")
        .range(from, to)
    ),
  ]);

  return {
    periods: getUniquePeriods(periodRows as RawData[]),
    salesmen: getUniqueSalesmanNames(salesmanRows as RawData[]),
  };
}

/** Fetch salesman & period dropdown data (Redis-cached API, with RPC fallback). */
export async function fetchIncentiveFilters(): Promise<IncentiveFilters> {
  const token = await getAccessToken();

  try {
    const res = await fetch("/api/incentive/filters", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      return (await res.json()) as IncentiveFilters;
    }

    const body = await res.json().catch(() => ({}));
    console.warn("API filters failed, trying RPC fallback:", body.error || res.status);
  } catch (err) {
    console.warn("API filters unreachable, trying RPC fallback:", err);
  }

  try {
    return await loadFiltersFromRpc();
  } catch (err) {
    console.warn("RPC fallback failed, using paginated scan:", err);
    return loadFiltersPaginated();
  }
}

/** Invalidate Redis cache after upload. */
export async function invalidateIncentiveFiltersCache(): Promise<void> {
  try {
    const token = await getAccessToken();
    await fetch("/api/incentive/filters", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn("Failed to invalidate incentive filters cache:", err);
  }
}

/** @deprecated Use fetchIncentiveFilters() */
export async function fetchUniquePeriodsFromDb(): Promise<
  ReturnType<typeof getUniquePeriods>
> {
  const filters = await fetchIncentiveFilters();
  return filters.periods;
}

/** @deprecated Use fetchIncentiveFilters() */
export async function fetchUniqueSalesmanNamesFromDb(): Promise<string[]> {
  const filters = await fetchIncentiveFilters();
  return filters.salesmen;
}

/** Fetch raw_data for a specific period (paginated). */
export async function fetchRawDataForPeriod(
  bln: string,
  year: number
): Promise<RawData[]> {
  return fetchAllPages<RawData>(async (from, to) =>
    supabase
      .from("raw_data")
      .select("*")
      .eq("bln", bln)
      .eq("year", year)
      .order("id")
      .range(from, to)
  );
}

export async function fetchTargetsForPeriod(
  bln: string,
  year: number
): Promise<IncentiveTarget[]> {
  const { data, error } = await supabase
    .from("incentive_targets")
    .select("*")
    .eq("bln", bln)
    .eq("year", year)
    .order("id");
  if (error) throw new Error(error.message);
  return (data as IncentiveTarget[]) || [];
}

export async function fetchTargetOutletsForPeriod(
  bln: string,
  year: number
): Promise<IncentiveTargetOutlet[]> {
  const { data, error } = await supabase
    .from("incentive_target_outlets")
    .select("*")
    .eq("bln", bln)
    .eq("year", year)
    .order("id");
  if (error) throw new Error(error.message);
  return (data as IncentiveTargetOutlet[]) || [];
}

export async function fetchNewPrincipalTargetsForPeriod(
  bln: string,
  year: number
): Promise<IncentiveNewPrincipalTarget[]> {
  const { data, error } = await supabase
    .from("incentive_new_principal_targets")
    .select("*")
    .eq("bln", bln)
    .eq("year", year)
    .order("id");
  if (error) throw new Error(error.message);
  return (data as IncentiveNewPrincipalTarget[]) || [];
}
