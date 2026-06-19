import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/database";

const PAGE_SIZE = 1000;

interface FetchAllOptions {
  statusFilter?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch ALL transactions from Supabase using pagination.
 * Supabase limits each query to 1000 rows, so this fetches
 * in pages until all data is retrieved.
 */
export async function fetchAllTransactions(
  options: FetchAllOptions = {}
): Promise<{ data: Transaction[]; error: Error | null }> {
  const { statusFilter, startDate, endDate } = options;

  const allData: Transaction[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter) query = query.eq("status", statusFilter);
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;

    if (error) {
      return { data: allData, error: new Error(error.message) };
    }

    const rows = (data as Transaction[]) || [];
    allData.push(...rows);

    // If we got fewer than PAGE_SIZE rows, we've reached the end
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return { data: allData, error: null };
}
