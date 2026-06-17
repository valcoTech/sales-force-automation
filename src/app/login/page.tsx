"use client";

import React from "react";
import { useLogin } from "@/hooks/useLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { form, error, loading, onSubmit } = useLogin();
  const { register, formState: { errors } } = form;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 px-4">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-[420px] border-slate-200/80 shadow-xl shadow-slate-200/50">
        <CardHeader className="space-y-2 pb-2 pt-8 text-center">
          {/* Logo mark */}
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25">
            <span className="text-xl font-black text-white tracking-tighter">SO</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Sales Order PBF
          </CardTitle>
          <CardDescription className="text-slate-500">
            Masuk ke account anda untuk melanjutkan
          </CardDescription>
        </CardHeader>

        <CardContent className="px-7 pb-8">
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="email@kamu.com"
                disabled={loading}
                className={errors.email ? "border-red-300 focus-visible:ring-red-500" : ""}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                disabled={loading}
                className={errors.password ? "border-red-300 focus-visible:ring-red-500" : ""}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            © 2024 Sales Order PBF. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
