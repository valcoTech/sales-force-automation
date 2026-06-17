import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/database";

export function useSalesmanDashboard() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    // Use getSession (cached, no network call) instead of getUser
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      toast.error("User belum login");
      setOrders([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .eq("salesman_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query;

    if (error) {
      console.error("Gagal load salesman transactions:", error);
      toast.error("Gagal memuat order");
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders((data as Transaction[]) || []);
    setLoading(false);
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalOrder = orders.length;
  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );
  const pending = orders.filter((order) => order.status === "pending").length;
  const proses = orders.filter((order) => order.status === "proses").length;
  const done = orders.filter((order) => order.status === "done").length;
  const reject = orders.filter((order) => order.status === "reject").length;

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
  };

  return {
    orders,
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
    loadOrders,
    handleReset,
  };
}
