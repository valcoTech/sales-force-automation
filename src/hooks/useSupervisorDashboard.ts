import { useEffect, useCallback, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, UserProfile } from "@/types/database";
import { filterOrdersForAdmin } from "@/lib/promelFilter";
import { fetchAllTransactions } from "@/lib/fetchAllTransactions";

export function useSupervisorDashboard() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [salesmen, setSalesmen] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    const { data, error } = await fetchAllTransactions({
      startDate,
      endDate,
      statusFilter,
    });

    if (error) {
      console.error("Gagal load supervisor transactions:", error);
      setOrders([]);
      setLoading(false);
      return;
    }

    const transactionData = data;

    const salesmanIds = [
      ...new Set(transactionData.map((order) => order.salesman_id)),
    ].filter(Boolean) as string[];

    let salesmanRows: UserProfile[] = [];

    if (salesmanIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", salesmanIds);

      if (usersError) {
        console.error("Gagal load salesmen:", usersError);
      } else {
        salesmanRows = (usersData as UserProfile[]) || [];
      }
    }

    const ordersWithSalesman = transactionData.map((order) => ({
      ...order,
      salesman:
        salesmanRows.find((user) => user.id === order.salesman_id) || null,
    }));

    setSalesmen(salesmanRows);
    // Promel orders hidden until apoteker approves
    setOrders(filterOrdersForAdmin(ordersWithSalesman));
    setLoading(false);
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime — subscribe once, use ref for latest loadOrders
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    const channel = supabase
      .channel("supervisor-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        () => {
          loadOrdersRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty deps — subscribe once

  const totalOrder = orders.length;
  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );
  const pending = orders.filter((order) => order.status === "pending").length;
  const proses = orders.filter((order) => order.status === "proses").length;
  const done = orders.filter((order) => order.status === "done").length;
  const reject = orders.filter((order) => order.status === "reject").length;
  const salesmanCount = salesmen.length;

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
  };

  return {
    orders,
    salesmen,
    loading,
    startDate,
    endDate,
    statusFilter,
    setStartDate,
    setEndDate,
    setStatusFilter,
    totalOrder,
    totalAmount,
    pending,
    proses,
    done,
    reject,
    salesmanCount,
    loadOrders,
    handleReset,
  };
}
