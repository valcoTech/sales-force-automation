import { useEffect, useCallback, useState } from "react";
import { supabase } from "../services/supabaseClient";
import OrderTable from "../components/OrderTable";

export default function SupervisorDashboard() {
  const [orders, setOrders] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Gagal load supervisor transactions:", error);
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

    const ordersWithSalesman = (data || []).map((order) => ({
      ...order,
      salesman:
        salesmanRows.find((user) => user.id === order.salesman_id) || null,
    }));

    setSalesmen(salesmanRows);
    setOrders(ordersWithSalesman);
    setLoading(false);
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("supervisor-orders-realtime")
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
  const pending = orders.filter((order) => order.status === "pending").length;
  const proses = orders.filter((order) => order.status === "proses").length;
  const done = orders.filter((order) => order.status === "done").length;
  const salesmanCount = salesmen.length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Supervisor
          </h1>
          <p className="text-sm text-gray-500">
            Monitoring seluruh order dari semua salesman.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <SummaryCard title="Total Order" value={totalOrder} />
          <SummaryCard
            title="Total Amount"
            value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
            small
          />
          <SummaryCard title="Salesman" value={salesmanCount} />
          <SummaryCard
            title="Pending"
            value={pending}
            color="text-yellow-600"
          />
          <SummaryCard title="Proses" value={proses} color="text-blue-600" />
          <SummaryCard title="Done" value={done} color="text-green-600" />
        </div>

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          statusFilter={statusFilter}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setStatusFilter={setStatusFilter}
          onRefresh={loadOrders}
        />

        {loading ? (
          <p className="text-sm text-gray-500">Memuat order...</p>
        ) : (
          <OrderTable orders={orders} showSalesman showItems showClaimStatus />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color = "text-gray-900", small = false }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p
        className={`mt-2 font-bold ${color} ${small ? "text-lg" : "text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function DateFilter({
  startDate,
  endDate,
  statusFilter,
  setStartDate,
  setEndDate,
  setStatusFilter,
  onRefresh,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
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

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Status Order
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua status</option>
            <option value="pending">Pending</option>
            <option value="proses">Proses</option>
            <option value="done">Done</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setStatusFilter("");
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
