"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useNewOrder } from "@/hooks/useNewOrder";
import CustomerSearch from "@/components/CustomerSearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewOrder() {
  const {
    loading,
    productList,
    keyword,
    setKeyword,
    submitting,
    showCustomer,
    setShowCustomer,
    selectedCustomer,
    removeItem,
    qtyUpdate,
    discountUpdate,
    bonusQtyUpdate,
    updateOrCreate,
    orderItems,
    totalAmount,
    handleSubmit,
  } = useNewOrder();

  const [activeTab, setActiveTab] = useState<"catalog" | "cart">("catalog");

  return (
    <>
      <div className="min-h-screen pb-24 lg:pb-0 lg:h-[calc(100vh-40px)] lg:overflow-hidden">
        {/* Mobile Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4 lg:hidden">
          <Button
            variant={activeTab === "catalog" ? "default" : "outline"}
            onClick={() => setActiveTab("catalog")}
            className={`w-full rounded-xl h-11 ${activeTab === "catalog" ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}`}
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari Produk
          </Button>
          <Button
            variant={activeTab === "cart" ? "default" : "outline"}
            onClick={() => setActiveTab("cart")}
            className={`w-full rounded-xl h-11 relative ${activeTab === "cart" ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}`}
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Keranjang
            {orderItems.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {orderItems.length}
              </span>
            )}
          </Button>
        </div>

        {/* Main Grid */}
        <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* ======== CATALOG PANEL ======== */}
          <Card
            className={`flex min-h-0 flex-col overflow-hidden border-slate-200 ${
              activeTab === "catalog" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Catalog Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <Link href="/salesman/dashboard" passHref>
                <Button variant="outline" size="sm">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </Button>
              </Link>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-sm">
                <span className="text-slate-400 font-medium">Customer:</span>
                {selectedCustomer ? (
                  <>
                    <span className="truncate font-semibold text-slate-800">
                      {selectedCustomer.customer_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomer(true)}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Ganti
                    </button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomer(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Pilih Customer
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 pb-2">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Cari produk (min. 4 karakter)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 min-h-[300px]">
              {keyword.trim().length <= 3 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Ketik minimal 4 karakter untuk memuat produk</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  <p className="text-sm text-slate-500">Mencari produk...</p>
                </div>
              ) : productList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Produk tidak ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {productList.map((product) => {
                    const qty =
                      orderItems.find(
                        (item) => item.product.product_id === product.product_id
                      )?.qty || 0;

                    return (
                      <button
                        type="button"
                        key={product.product_id}
                        onClick={() => updateOrCreate(product)}
                        className={`group min-h-[130px] rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          Number(qty) > 0
                            ? "border-blue-300 bg-blue-50/60 shadow-sm ring-1 ring-blue-200/50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="w-full">
                          <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {product.principal_name || "Tanpa Principal"}
                          </p>
                          <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">
                            {product.product_name}
                          </h4>
                        </div>

                        <div className="w-full mt-2.5 pt-2 border-t border-slate-100/80 flex items-end justify-between">
                          <div>
                            <p className="text-xs font-bold text-blue-600">
                              Rp {Number(product.price || 0).toLocaleString("id-ID")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Stock: {Number(product.stock || 0).toLocaleString("id-ID")}
                            </p>
                          </div>

                          {Number(qty) > 0 && (
                            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              x{qty}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ======== CART PANEL ======== */}
          <Card
            className={`flex min-h-[450px] flex-col overflow-hidden border-slate-200 lg:min-h-0 ${
              activeTab === "cart" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Cart Header */}
            <div className="border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Keranjang ({orderItems.length})
              </h3>
              {orderItems.length > 0 && (
                <span className="text-[11px] font-medium text-slate-400">
                  Atur qty dan diskon
                </span>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Belum ada produk dipilih</p>
                </div>
              ) : (
                orderItems.map((item) => {
                  const product = item.product;
                  const price = Number(product.price || 0);
                  const qtyValue = item.qty;
                  const qtyNumber = Number(qtyValue || 0);
                  const discount = Number(item.discount || 0);
                  const bonusQty = Number(item.bonus_qty || 0);
                  const subtotal = price * qtyNumber;
                  const qtyInvalid =
                    qtyValue === "" ||
                    qtyValue === null ||
                    Number.isNaN(Number(qtyValue)) ||
                    Number(qtyValue) < 1;

                  return (
                    <div
                      key={product.product_id}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        qtyInvalid
                          ? "border-red-200 bg-red-50/50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-xs font-semibold text-slate-800">
                            {product.product_name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Rp {price.toLocaleString("id-ID")} / pcs
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(product.product_id)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Qty Controls */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Jumlah (Qty)
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                qtyUpdate(product.product_id, Math.max(qtyNumber - 1, 0))
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 cursor-pointer text-lg font-bold shadow-sm transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qtyValue}
                              onChange={(e) =>
                                qtyUpdate(product.product_id, e.target.value)
                              }
                              className={`h-10 w-16 rounded-xl border text-center text-sm font-bold focus:outline-none focus:ring-1 bg-white text-slate-900 ${
                                qtyInvalid
                                  ? "border-red-300 focus:ring-red-400"
                                  : "border-slate-200 focus:ring-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                qtyUpdate(product.product_id, qtyNumber + 1)
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 cursor-pointer text-lg font-bold shadow-sm transition-colors"
                            >
                              +
                            </button>
                          </div>
                          {qtyInvalid && (
                            <p className="mt-1 text-[10px] text-red-500 font-medium">
                              Qty harus diisi minimal 1
                            </p>
                          )}
                        </div>

                        {/* Discount & Bonus */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Discount (%)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={discount}
                              onChange={(e) =>
                                discountUpdate(product.product_id, e.target.value)
                              }
                              className="h-9 bg-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Bonus Qty
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={bonusQty}
                              onChange={(e) =>
                                bonusQtyUpdate(product.product_id, e.target.value)
                              }
                              className="h-9 bg-white"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-xs">
                          <span className="text-slate-400 font-medium">Subtotal</span>
                          <span className="font-bold text-slate-900">
                            Rp {subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-slate-100 p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Total Item</span>
                <span>{orderItems.length} produk</span>
              </div>

              <div className="flex justify-between items-baseline border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-700">Total Nominal</span>
                <span className="text-lg font-bold text-slate-900">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || orderItems.length === 0 || !selectedCustomer}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/20 text-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan Order...
                  </span>
                ) : "Kirim Order"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showCustomer && (
        <CustomerSearch onClose={() => setShowCustomer(false)} />
      )}
    </>
  );
}
