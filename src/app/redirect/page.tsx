"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ROLE_PATHS: Record<string, string> = {
  salesman: "/salesman/dashboard",
  supervisor: "/supervisor/dashboard",
  admin_sales: "/admin-sales/dashboard",
  admin_claim: "/admin-claim/dashboard",
  apoteker: "/apoteker/dashboard",
};

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectByRole = async () => {
      // getSession() reads from local cache — no network call
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      // maybeSingle() is faster than .limit(1) + array access
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !userData) {
        console.error("Gagal ambil role:", error);
        router.replace("/login");
        return;
      }

      const path = ROLE_PATHS[userData.role];

      if (!path) {
        console.error("Role tidak dikenal:", userData.role);
        router.replace("/login");
        return;
      }

      router.replace(path);
    };

    redirectByRole();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Redirecting...</p>
      </div>
    </div>
  );
}
