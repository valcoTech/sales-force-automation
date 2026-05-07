import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function DashboardLayout({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", user.id)
        .limit(1);

      setUserProfile(data?.[0] || null);
    };

    loadProfile();
  }, []);

  const role = userProfile?.role?.trim();
  const name = userProfile?.full_name || "User";
  const initial = name.charAt(0).toUpperCase();

  const dashboardPath =
    role === "supervisor"
      ? "/supervisor/dashboard"
      : role === "admin_sales"
        ? "/admin-sales/dashboard"
        : role === "admin_claim"
          ? "/admin-claim/dashboard"
          : "/salesman/dashboard";

  const canOpenOrder = role === "salesman";
  const canOpenStock = role === "admin_sales" || role === "supervisor";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-emerald-800 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <div className="min-h-screen bg-[#eef1ef] p-0 text-slate-950 lg:p-3">
      <div className="min-h-screen overflow-hidden bg-[#f7f8f6] lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-sm">
        <aside className="hidden border-r border-slate-200 bg-white/90 p-4 lg:flex lg:flex-col">
          <div className="mb-5 flex items-center justify-between">
            <Link
              to={dashboardPath}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-sm font-black text-white"
            >
              S
            </Link>

            <div className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500">
              PBF
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <nav className="space-y-1">
            <NavLink to={dashboardPath} className={navClass}>
              <span className="text-base">▣</span>
              Dashboard
            </NavLink>

            {canOpenOrder && (
              <NavLink to="/salesman/order" className={navClass}>
                <span className="text-base">□</span>
                Order
              </NavLink>
            )}

            {canOpenStock && (
              <NavLink to="/stock-upload" className={navClass}>
                <span className="text-base">⇧</span>
                Upload Stock
              </NavLink>
            )}
          </nav>

          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-bold text-slate-400">
              Activity
            </p>

            <div className="space-y-1">
              <NavLink to={dashboardPath} className={navClass}>
                <span className="text-base">◎</span>
                Reports
              </NavLink>

              <NavLink to={dashboardPath} className={navClass}>
                <span className="text-base">↺</span>
                History
              </NavLink>
            </div>
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">
                  {name}
                </p>
                <p className="truncate text-xs text-slate-500">{role || "-"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
              {initial}
            </div>
            <div>
              <p className="text-base font-black text-emerald-900">
                Sales Order
              </p>
              <p className="text-xs text-slate-500">{role || "-"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500"
          >
            Logout
          </button>
        </header>

        <main className="min-h-screen overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-6 lg:py-6">
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white lg:hidden">
          <NavLink
            to={dashboardPath}
            className="py-3 text-center text-xs font-bold text-emerald-800"
          >
            Dashboard
          </NavLink>

          {canOpenOrder ? (
            <NavLink
              to="/salesman/order"
              className="py-3 text-center text-xs font-bold text-slate-600"
            >
              Order
            </NavLink>
          ) : (
            <NavLink
              to={dashboardPath}
              className="py-3 text-center text-xs font-bold text-slate-600"
            >
              Orders
            </NavLink>
          )}

          <NavLink
            to={canOpenStock ? "/stock-upload" : dashboardPath}
            className="py-3 text-center text-xs font-bold text-slate-600"
          >
            {canOpenStock ? "Stock" : "Reports"}
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
