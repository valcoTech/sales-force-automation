import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";
import OrderTable from "../components/OrderTable";

export default function AdminClaimDashboard() {
  const [orders, setOrders] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .order("created_at", { ascending: false });

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      toast.error("Gagal memuat order");
      setOrders([]);
      setLoading(false);
      return;
    }

    const salesmanIds = [
      ...new Set((data || []).map((order) => order.salesman_id)),
    ].filter(Boolean);

    let salesmanRows = [];

    if (salesmanIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", salesmanIds);

      if (usersError) {
        console.error("Gagal load salesmen:", usersError);
      } else {
        salesmanRows = usersData || [];
      }
    }

    setSalesmen(salesmanRows);

    setOrders(
      (data || []).map((order) => ({
        ...order,
        salesman:
          salesmanRows.find((user) => user.id === order.salesman_id) || null,
      })),
    );

    setLoading(false);
  }, [startDate, endDate]);

  const updateClaimStatus = async (transactionId, claimStatus) => {
    const { error } = await supabase
      .from("transactions")
      .update({ claim_status: claimStatus })
      .eq("id", transactionId);

    if (error) {
      console.error("Gagal update claim:", error);
      toast.error("Gagal update claim");
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === transactionId
          ? { ...order, claim_status: claimStatus }
          : order,
      ),
    );

    toast.success("Status claim berhasil diupdate");
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-claim-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          loadOrders();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_items",
        },
        () => {
          loadOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const totalOrder = orders.length;

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );

  const totalItem = orders.reduce(
    (sum, order) => sum + Number(order.transaction_items?.length || 0),
    0,
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Admin Claim
          </h1>
          <p className="text-sm text-gray-500">
            Melihat order, item order, dan status claim.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard title="Total Order" value={totalOrder} />

          <SummaryCard
            title="Total Amount"
            value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
            small
          />

          <SummaryCard title="Total Item" value={totalItem} />

          <SummaryCard title="Salesman" value={salesmen.length} />
        </div>

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onRefresh={loadOrders}
        />

        {loading ? (
          <p className="text-sm text-gray-500">Memuat order...</p>
        ) : (
          <OrderTable
            orders={orders}
            showSalesman
            showItems
            showClaimStatus
            onClaimStatusChange={updateClaimStatus}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, small = false }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p
        className={`mt-2 font-bold text-gray-900 ${
          small ? "text-lg" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DateFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onRefresh,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Dari tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Sampai tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
