import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [appUser, setAppUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setHasSession(false);
        setLoading(false);
        return;
      }

      setHasSession(true);

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", user.id)
        .limit(1);

      if (error) {
        console.error("Gagal ambil user role:", error);
        setAppUser(null);
      } else {
        setAppUser(data?.[0] || null);
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Loading...</p>;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(appUser.role)) {
    return <Navigate to="/redirect" replace />;
  }

  return children;
}
