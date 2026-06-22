import { NextResponse } from "next/server";
import { getUniquePeriods } from "@/lib/incentiveCalculation";
import {
  getCachedIncentiveFilters,
  setCachedIncentiveFilters,
  invalidateAllIncentiveFiltersCache,
} from "@/lib/redis";
import {
  createSupabaseWithToken,
  getBearerToken,
} from "@/lib/supabase-server";
import type { RawData } from "@/types/incentive";

export interface IncentiveFiltersResponse {
  periods: { bln: string; month: string; year: number }[];
  salesmen: string[];
}

async function loadFiltersFromDb(
  accessToken: string
): Promise<IncentiveFiltersResponse> {
  const supabase = createSupabaseWithToken(accessToken);

  const [periodsRes, salesmenRes] = await Promise.all([
    supabase.rpc("get_incentive_periods"),
    supabase.rpc("get_incentive_salesmen"),
  ]);

  if (periodsRes.error) {
    throw new Error(periodsRes.error.message);
  }
  if (salesmenRes.error) {
    throw new Error(salesmenRes.error.message);
  }

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

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseWithToken(token);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cached = await getCachedIncentiveFilters<IncentiveFiltersResponse>(
      user.id
    );
    if (cached) {
      return NextResponse.json(cached);
    }

    const filters = await loadFiltersFromDb(token);
    await setCachedIncentiveFilters(user.id, filters);

    return NextResponse.json(filters);
  } catch (err) {
    console.error("GET /api/incentive/filters error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseWithToken(token);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await invalidateAllIncentiveFiltersCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/incentive/filters error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
