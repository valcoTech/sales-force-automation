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

  const initial = userProfile?.full_name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }) =>
    `rounded-xl px-4 py-3 text-sm font-medium ${
      isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="border-b border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-5 py-5">
            <Link to={dashboardPath}>
              <h1 className="text-lg font-bold text-gray-900">SALES ORDER</h1>
              <p className="text-xs text-gray-500">PBF Dashboard</p>
            </Link>
          </div>

          <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible">
            <NavLink to={dashboardPath} className={navClass}>
              Dashboard
            </NavLink>

            {canOpenOrder && (
              <NavLink to="/salesman/order" className={navClass}>
                Order
              </NavLink>
            )}

            {canOpenStock && (
              <NavLink to="/stock-upload" className={navClass}>
                Upload Stock
              </NavLink>
            )}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {userProfile?.full_name || "User"}
                </p>
                <p className="truncate text-xs text-gray-500">{role || "-"}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen flex-1 lg:ml-64">{children}</main>
    </div>
  );
}
