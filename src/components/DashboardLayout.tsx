"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/database";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      // Use getSession (cached, no network call) instead of getUser (makes network call)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        setUserProfile((data as UserProfile) || null);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
          : role === "apoteker"
            ? "/apoteker/dashboard"
            : "/salesman/dashboard";

  const canOpenOrder = role === "salesman";
  const canOpenStock = role === "admin_sales" || role === "supervisor";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const roleBadge =
    role === "supervisor"
      ? "Supervisor"
      : role === "admin_sales"
        ? "Admin Sales"
        : role === "admin_claim"
          ? "Admin Claim"
          : role === "apoteker"
            ? "Apoteker"
            : "Salesman";

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* SIDEBAR — Desktop only */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shadow-blue-600/20">
            <span className="text-xs font-black text-white tracking-tighter">SO</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Sales Order</p>
            <p className="text-[11px] text-slate-400">PBF Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menu Utama
          </p>
          <SideNavLink href={dashboardPath} icon="📊" label="Dashboard" active={pathname === dashboardPath} />
          {canOpenOrder && (
            <SideNavLink href="/salesman/order" icon="📝" label="Buat Order" active={pathname === "/salesman/order"} />
          )}
          {canOpenStock && (
            <SideNavLink href="/stock-upload" icon="📦" label="Upload Stock" active={pathname === "/stock-upload"} />
          )}

          <div className="my-4 border-t border-slate-100" />

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Aktivitas
          </p>
          <SideNavLink href={`${dashboardPath}?tab=reports`} icon="📈" label="Reports" active={false} />
          <SideNavLink href={`${dashboardPath}?tab=history`} icon="🕐" label="Riwayat" active={false} />
        </nav>

        {/* User card */}
        <div className="border-t border-slate-100 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{roleBadge}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-lg lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {initial}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Sales Order</p>
              <p className="text-[11px] text-slate-500">{roleBadge}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 cursor-pointer"
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden">
          <div className="grid grid-cols-3">
            <MobileNavLink
              href={dashboardPath}
              icon="📊"
              label="Dashboard"
              active={pathname === dashboardPath}
            />
            {canOpenOrder ? (
              <MobileNavLink
                href="/salesman/order"
                icon="📝"
                label="Order"
                active={pathname === "/salesman/order"}
              />
            ) : (
              <MobileNavLink
                href={dashboardPath}
                icon="📋"
                label="Orders"
                active={false}
              />
            )}
            <MobileNavLink
              href={canOpenStock ? "/stock-upload" : dashboardPath}
              icon={canOpenStock ? "📦" : "📈"}
              label={canOpenStock ? "Stock" : "Reports"}
              active={canOpenStock ? pathname === "/stock-upload" : false}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function SideNavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center text-[15px]">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-3 text-center transition-colors",
        active
          ? "text-blue-600"
          : "text-slate-500 hover:text-slate-700"
      )}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}
