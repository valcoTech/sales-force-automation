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
  const reject = orders.filter((order) => order.status === "reject").length;

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">
              Dashboard Salesman
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ringkasan order yang kamu input.
            </p>
          </div>

          <Link
            to="/salesman/order"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Buat Order
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <SummaryCard title="Total Order" value={totalOrder} />
          <SummaryCard
            title="Total Amount"
            value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
            className="col-span-2"
            small
          />
          <SummaryCard
            title="Pending"
            value={pending}
            color="text-yellow-600"
          />
          <SummaryCard title="Proses" value={proses} color="text-blue-600" />
          <SummaryCard title="Done" value={done} color="text-green-600" />
          <SummaryCard title="Reject" value={reject} color="text-red-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Dari tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Sampai tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Status Order
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={loadOrders}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat order...</p>
        ) : (
          <OrderTable orders={orders} showItems showClaimStatus />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color = "text-slate-950",
  small = false,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 text-center ${className}`}
    >
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p
        className={`mt-2 font-bold ${color} ${small ? "text-xl" : "text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}
