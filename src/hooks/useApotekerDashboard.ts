import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { Transaction, UserProfile } from "@/types/database";

const PROMEL_KEYWORD = "promel";

/** Returns true if any item in the order is a Promel product */
export function hasPromelItem(order: Transaction): boolean {
  return (order.transaction_items || []).some(
    (item) =>
      item.products?.product_name?.toLowerCase().includes(PROMEL_KEYWORD) ||
      item.products?.principal_name?.toLowerCase().includes(PROMEL_KEYWORD)
  );
}

export function useApotekerDashboard() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    // Fetch all orders that contain at least one Promel product
    // We filter on the client side since Supabase doesn't support
    // filtering by a joined column easily in a single query
    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .order("created_at", { ascending: false })
      .limit(300);

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (approvalFilter) query = query.eq("apoteker_status", approvalFilter);

    const { data, error } = await query;

    if (error) {
      console.error("Gagal load apoteker orders:", error);
      toast.error("Gagal memuat data order");
      setOrders([]);
      setLoading(false);
      return;
    }

    const all = (data as Transaction[]) || [];

    // Only show orders that have at least one Promel product
    const promelOrders = all.filter(hasPromelItem);

    // Enrich with salesman names
    const salesmanIds = [
      ...new Set(promelOrders.map((o) => o.salesman_id)),
    ].filter(Boolean) as string[];

    let salesmanRows: UserProfile[] = [];
    if (salesmanIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", salesmanIds);
      salesmanRows = (usersData as UserProfile[]) || [];
    }

    setOrders(
      promelOrders.map((order) => ({
        ...order,
        salesman:
          salesmanRows.find((u) => u.id === order.salesman_id) || null,
      }))
    );
    setLoading(false);
  }, [startDate, endDate, approvalFilter]);

  /** Approve or reject a specific order */
  const updateApproval = async (
    transactionId: string,
    status: "approved" | "rejected",
    note: string = ""
  ) => {
    if (status === "rejected" && note.trim() === "") {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        apoteker_status: status,
        apoteker_note: note.trim() || null,
      })
      .eq("id", transactionId);

    if (error) {
      console.error("Gagal update approval:", error);
      toast.error("Gagal update approval");
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === transactionId
          ? { ...o, apoteker_status: status, apoteker_note: note.trim() || null }
          : o
      )
    );

    toast.success(
      status === "approved"
        ? "Order disetujui ✓"
        : "Order ditolak"
    );
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime — subscribe once
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    const channel = supabase
      .channel("apoteker-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => loadOrdersRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derived stats
  const totalOrder = orders.length;
  const pending = orders.filter(
    (o) => !o.apoteker_status || o.apoteker_status === "pending"
  ).length;
  const approved = orders.filter((o) => o.apoteker_status === "approved").length;
  const rejected = orders.filter((o) => o.apoteker_status === "rejected").length;

  const totalAmount = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setApprovalFilter("");
  };

  return {
    orders,
    loading,
    startDate,
    endDate,
    approvalFilter,
    setStartDate,
    setEndDate,
    setApprovalFilter,
    totalOrder,
    pending,
    approved,
    rejected,
    totalAmount,
    loadOrders,
    updateApproval,
    handleReset,
  };
}
