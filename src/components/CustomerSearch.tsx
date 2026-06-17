"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrderStore } from "@/store/useOrderStore";
import { Customer } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CustomerSearchProps {
  onClose: () => void;
}

export default function CustomerSearch({ onClose }: CustomerSearchProps) {
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { setCustomer } = useOrderStore();
  const [keyword, setKeyword] = useState("");

  const handleSearch = async (value: string) => {
    setKeyword(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .ilike("customer_name", `%${value}%`)
      .limit(10);
      
    if (!error && data) {
      setResults(data as Customer[]);
    }
    setLoading(false);
  };

  const handleSelect = (customer: Customer) => {
    setCustomer(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pilih Customer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cari dan pilih customer untuk order ini</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              autoFocus
              placeholder="Ketik nama customer..."
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-4 pb-4">
          {loading && (
            <p className="py-6 text-center text-sm text-slate-400 animate-pulse">Mencari...</p>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-blue-50 hover:shadow-sm cursor-pointer group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {customer.customer_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{customer.customer_name}</p>
                    <p className="truncate text-xs text-slate-400">{customer.customer_id}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {!loading && keyword.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Customer tidak ditemukan</p>
            </div>
          )}

          {keyword.length < 2 && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Ketik minimal 2 huruf untuk mencari</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
