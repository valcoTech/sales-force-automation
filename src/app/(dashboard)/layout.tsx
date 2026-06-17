"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
