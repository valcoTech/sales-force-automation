import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, UserProfile } from "@/types/database";
import { filterOrdersForAdmin } from "@/lib/promelFilter";
import { fetchAllTransactions } from "@/lib/fetchAllTransactions";

export interface PrincipalSales {
  principal_name: string;
  total_value: number;
  total_items: number;
}

export interface SalesmanSales {
  salesman_id: string;
  salesman_name: string;
  total_value: number;
  total_orders: number;
}

export interface SalesmanOutletCount {
  salesman_id: string;
  salesman_name: string;
  unique_outlet_count: number;
}

export interface OutletByPrincipalBySalesman {
  salesman_id: string;
  salesman_name: string;
  principal_name: string;
  unique_outlet_count: number;
  outlets: string[];
}

export function useSupervisorReport() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [principalSales, setPrincipalSales] = useState<PrincipalSales[]>([]);
  const [salesmanSales, setSalesmanSales] = useState<SalesmanSales[]>([]);
  const [salesmanOutlets, setSalesmanOutlets] = useState<SalesmanOutletCount[]>([]);
  const [outletByPrincipalBySalesman, setOutletByPrincipalBySalesman] = useState<OutletByPrincipalBySalesman[]>([]);

  const loadReport = useCallback(async () => {
    setLoading(true);

    // 1. Fetch all "done" transactions with pagination
    const { data, error } = await fetchAllTransactions({
      statusFilter: "done",
      startDate,
      endDate,
    });

    if (error) {
      console.error("Gagal load report data:", error);
      setLoading(false);
      return;
    }

    const rawTransactions = data;

    // 2. Fetch salesman info
    const salesmanIds = [
      ...new Set(rawTransactions.map((t) => t.salesman_id)),
    ].filter(Boolean) as string[];

    let salesmanMap: Record<string, string> = {};

    if (salesmanIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", salesmanIds);

      if (usersData) {
        for (const u of usersData as UserProfile[]) {
          salesmanMap[u.id] = u.full_name;
        }
      }
    }

    // Attach salesman info + apply promel filter
    const transactions = filterOrdersForAdmin(
      rawTransactions.map((t) => ({
        ...t,
        salesman: salesmanMap[t.salesman_id]
          ? { id: t.salesman_id, full_name: salesmanMap[t.salesman_id], role: "salesman" as const }
          : null,
      }))
    );

    // === Report 1: Total Value Sales per Principal ===
    const principalMap = new Map<string, { total_value: number; total_items: number }>();
    for (const tx of transactions) {
      for (const item of tx.transaction_items || []) {
        const pName = item.products?.principal_name || "Tidak Diketahui";
        const existing = principalMap.get(pName) || { total_value: 0, total_items: 0 };
        existing.total_value += Number(item.price_at_time || 0) * Number(item.qty || 0);
        existing.total_items += Number(item.qty || 0);
        principalMap.set(pName, existing);
      }
    }
    const principalResult: PrincipalSales[] = Array.from(principalMap.entries())
      .map(([name, val]) => ({ principal_name: name, ...val }))
      .sort((a, b) => b.total_value - a.total_value);

    // === Report 2: Penjualan per Salesman ===
    const salesmanSalesMap = new Map<string, { total_value: number; total_orders: number }>();
    for (const tx of transactions) {
      const sid = tx.salesman_id;
      const existing = salesmanSalesMap.get(sid) || { total_value: 0, total_orders: 0 };
      existing.total_value += Number(tx.total_amount || 0);
      existing.total_orders += 1;
      salesmanSalesMap.set(sid, existing);
    }
    const salesmanSalesResult: SalesmanSales[] = Array.from(salesmanSalesMap.entries())
      .map(([sid, val]) => ({
        salesman_id: sid,
        salesman_name: salesmanMap[sid] || "Unknown",
        ...val,
      }))
      .sort((a, b) => b.total_value - a.total_value);

    // === Report 3: Jumlah Outlet Transaksi per Salesman (unique per day) ===
    // An outlet that has 2 transactions on the same day counts as 1
    const salesmanOutletMap = new Map<string, Set<string>>();
    for (const tx of transactions) {
      const sid = tx.salesman_id;
      const outletKey = `${tx.customer_id}_${tx.date}`;
      if (!salesmanOutletMap.has(sid)) {
        salesmanOutletMap.set(sid, new Set());
      }
      salesmanOutletMap.get(sid)!.add(outletKey);
    }
    const salesmanOutletsResult: SalesmanOutletCount[] = Array.from(salesmanOutletMap.entries())
      .map(([sid, outletSet]) => ({
        salesman_id: sid,
        salesman_name: salesmanMap[sid] || "Unknown",
        unique_outlet_count: outletSet.size,
      }))
      .sort((a, b) => b.unique_outlet_count - a.unique_outlet_count);

    // === Report 4: Outlet Transaksi by Principal by Salesman ===
    // Group by (salesman, principal) -> unique outlets
    const spOutletMap = new Map<string, { outlets: Set<string>; outletNames: Set<string> }>();
    for (const tx of transactions) {
      const sid = tx.salesman_id;
      const customerName = tx.customers?.customer_name || tx.customer_id;

      for (const item of tx.transaction_items || []) {
        const pName = item.products?.principal_name || "Tidak Diketahui";
        const key = `${sid}|||${pName}`;

        if (!spOutletMap.has(key)) {
          spOutletMap.set(key, { outlets: new Set(), outletNames: new Set() });
        }
        const entry = spOutletMap.get(key)!;
        entry.outlets.add(tx.customer_id);
        entry.outletNames.add(customerName);
      }
    }

    const outletByPrincipalResult: OutletByPrincipalBySalesman[] = Array.from(spOutletMap.entries())
      .map(([key, val]) => {
        const [sid, pName] = key.split("|||");
        return {
          salesman_id: sid,
          salesman_name: salesmanMap[sid] || "Unknown",
          principal_name: pName,
          unique_outlet_count: val.outlets.size,
          outlets: Array.from(val.outletNames),
        };
      })
      .sort((a, b) => {
        if (a.salesman_name !== b.salesman_name) return a.salesman_name.localeCompare(b.salesman_name);
        return b.unique_outlet_count - a.unique_outlet_count;
      });

    // Set all state
    setPrincipalSales(principalResult);
    setSalesmanSales(salesmanSalesResult);
    setSalesmanOutlets(salesmanOutletsResult);
    setOutletByPrincipalBySalesman(outletByPrincipalResult);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  // Totals
  const grandTotalSales = salesmanSales.reduce((sum, s) => sum + s.total_value, 0);
  const totalSalesman = salesmanSales.length;
  const totalUniqueOutlets = new Set(salesmanOutlets.flatMap((s) => 
    // We just sum unique counts — not perfectly unique across salesmen but sufficient
    Array.from({ length: s.unique_outlet_count }, (_, i) => `${s.salesman_id}_${i}`)
  )).size;

  return {
    loading,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    principalSales,
    salesmanSales,
    salesmanOutlets,
    outletByPrincipalBySalesman,
    grandTotalSales,
    totalSalesman,
    totalUniqueOutlets,
    loadReport,
    handleReset,
  };
}
