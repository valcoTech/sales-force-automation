import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { Transaction, UserProfile } from "@/types/database";
import { filterOrdersForAdmin } from "@/lib/promelFilter";

export function useAdminClaimDashboard() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [salesmen, setSalesmen] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .order("created_at", { ascending: false })
      .limit(200);

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (claimStatusFilter) query = query.eq("claim_status", claimStatusFilter);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      toast.error("Gagal memuat order");
      setOrders([]);
      setLoading(false);
      return;
    }

    const transactionData = (data as Transaction[]) || [];

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

    setSalesmen(salesmanRows);

    // Promel orders hidden until apoteker approves
    setOrders(
      filterOrdersForAdmin(
        transactionData.map((order) => ({
          ...order,
          salesman:
            salesmanRows.find((u) => u.id === order.salesman_id) || null,
        }))
      )
    );

    setLoading(false);
  }, [startDate, endDate, claimStatusFilter]);

  const updateClaimStatus = async (
    transactionId: string,
    claimStatus: string,
    rejectReason: string = ""
  ) => {
    if (claimStatus === "reject" && rejectReason.trim() === "") {
      toast.error("Alasan reject wajib diisi");
      return;
    }

    const payload = {
      claim_status: claimStatus,
      claim_reject_reason:
        claimStatus === "reject" ? rejectReason.trim() : null,
    };

    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", transactionId);

    if (error) {
      console.error("Gagal update claim:", error);
      toast.error("Gagal update claim");
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === transactionId
          ? {
              ...order,
              claim_status: claimStatus as any,
              claim_reject_reason:
                claimStatus === "reject" ? rejectReason.trim() : null,
            }
          : order
      )
    );

    toast.success("Status claim berhasil diupdate");
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime — subscribe once, use ref so callback always calls latest loadOrders
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    const channel = supabase
      .channel("admin-claim-orders-realtime")
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

  const totalItem = orders.reduce(
    (sum, order) => sum + Number(order.transaction_items?.length || 0),
    0
  );

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setClaimStatusFilter("");
  };

  return {
    orders,
    salesmen,
    loading,
    startDate,
    endDate,
    claimStatusFilter,
    setStartDate,
    setEndDate,
    setClaimStatusFilter,
    totalOrder,
    totalAmount,
    totalItem,
    loadOrders,
    updateClaimStatus,
    handleReset,
  };
}
