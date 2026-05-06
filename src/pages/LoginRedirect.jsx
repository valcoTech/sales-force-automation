import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function LoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectByRole = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", user.id)
        .limit(1);

      if (error) {
        console.error("Gagal ambil role:", error);
        navigate("/login", { replace: true });
        return;
      }

      const appUser = data?.[0];

      if (!appUser) {
        console.error("User belum ada di public.users:", user.id);
        navigate("/login", { replace: true });
        return;
      }

      if (appUser.role === "salesman") {
        navigate("/salesman/dashboard", { replace: true });
        return;
      }

      if (appUser.role === "supervisor") {
        navigate("/supervisor/dashboard", { replace: true });
        return;
      }

      if (appUser.role === "admin_sales") {
        navigate("/admin-sales/dashboard", { replace: true });
        return;
      }

      if (appUser.role === "admin_claim") {
        navigate("/admin-claim/dashboard", { replace: true });
        return;
      }

      console.error("Role tidak dikenal:", appUser.role);
      navigate("/login", { replace: true });
    };

    redirectByRole();
  }, [navigate]);

  return <p className="p-4 text-sm text-gray-500">Redirecting...</p>;
}
