import { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";
import OrderTable from "../components/OrderTable";

export default function SalesmanDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("User belum login");
      setOrders([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("transactions")
      .select("*, customers(*), transaction_items(*, products(*))")
      .eq("salesman_id", user.id)
      .order("created_at", { ascending: false });

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

    setOrders(data || []);
    setLoading(false);
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalOrder = orders.length;
  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );
  const pending = orders.filter((order) => order.status === "pending").length;
  const proses = orders.filter((order) => order.status === "proses").length;
  const done = orders.filter((order) => order.status === "done").length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Salesman
            </h1>
            <p className="text-sm text-gray-500">
              Ringkasan order yang kamu input.
            </p>
          </div>

          <Link
            to="/salesman/order"
            className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Buat Order
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard title="Total Order" value={totalOrder} />
          <SummaryCard
            title="Total Amount"
            value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
            small
          />
          <SummaryCard
            title="Pending"
            value={pending}
            color="text-yellow-600"
          />
          <SummaryCard title="Proses" value={proses} color="text-blue-600" />
          <SummaryCard title="Done" value={done} color="text-green-600" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
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
              onClick={loadOrders}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat order...</p>
        ) : (
          <OrderTable orders={orders} />
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
