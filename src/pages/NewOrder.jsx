import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";
import { useOrderStore } from "../store/useOrderStore";
import CustomerSearch from "../components/CustomerSearch";

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function NewOrder() {
  const [loading, setLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);

  const navigate = useNavigate();

  const {
    selectedCustomer,
    removeItem,
    qtyUpdate,
    discountUpdate,
    bonusQtyUpdate,
    resetOrder,
    updateOrCreate,
    orderItems,
  } = useOrderStore();

  useEffect(() => {
    const search = keyword.trim();

    if (search.length <= 3) {
      setProductList([]);
      setLoading(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(
          `product_name.ilike.%${search}%,product_id.ilike.%${search}%,principal_name.ilike.%${search}%`,
        )
        .order("product_name")
        .limit(30);

      if (error) {
        toast.error("Gagal mencari produk");
        setProductList([]);
      } else {
        setProductList(data || []);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [keyword]);

  const totalAmount = orderItems.reduce((sum, item) => {
    const price = Number(item.product.price || 0);
    const qty = Number(item.qty || 0);

    return sum + price * qty;
  }, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("Pilih customer dulu");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    const invalidQtyItem = orderItems.find((item) => {
      const qty = Number(item.qty);

      return (
        item.qty === "" || item.qty === null || Number.isNaN(qty) || qty < 1
      );
    });

    if (invalidQtyItem) {
      toast.error(
        "Ada produk dengan qty kosong atau 0. Isi qty atau hapus item dulu.",
      );
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("User belum login");
      setSubmitting(false);
      return;
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        date: getLocalDate(),
        customer_id: selectedCustomer.id,
        salesman_id: user.id,
        total_amount: totalAmount,
        status: "pending",
        claim_status: "pending",
      })
      .select()
      .single();

    if (txError) {
      console.error(txError);
      toast.error("Gagal simpan transaksi");
      setSubmitting(false);
      return;
    }

    const transactionItems = orderItems.map((item) => {
      const price = Number(item.product.price || 0);
      const qty = Number(item.qty || 0);
      const discount = Number(item.discount || 0);
      const bonusQty = Number(item.bonus_qty || 0);

      return {
        transaction_id: transaction.id,
        product_id: item.product.product_id,
        qty,
        bonus_qty: bonusQty,
        price_at_time: price,
        discount,
        subtotal: price * qty,
      };
    });

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems);

    if (itemsError) {
      console.error(itemsError);
      toast.error("Gagal simpan item");
      setSubmitting(false);
      return;
    }

    toast.success("Order berhasil dikirim");
    resetOrder();
    setKeyword("");
    setProductList([]);
    setSubmitting(false);
    navigate("/salesman/dashboard");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:h-screen lg:overflow-hidden">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/salesman/dashboard"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back Dashboard
              </Link>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <span className="text-sm text-gray-400">Customer:</span>

                {selectedCustomer ? (
                  <>
                    <span className="truncate text-sm font-medium text-gray-800">
                      {selectedCustomer.customer_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomer(true)}
                      className="text-xs font-medium text-blue-500 hover:underline"
                    >
                      Ganti
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomer(true)}
                    className="text-sm font-medium text-blue-500 hover:underline"
                  >
                    Pilih customer
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cari produk minimal 4 karakter..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            {keyword.trim().length <= 3 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Ketik lebih dari 3 karakter untuk mencari produk
              </p>
            ) : loading ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Mencari produk...
              </p>
            ) : (
              <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-visible sm:grid-cols-2 lg:min-h-0 lg:overflow-y-auto xl:grid-cols-3">
                {productList.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-sm text-gray-400">
                    Produk tidak ditemukan
                  </p>
                ) : (
                  productList.map((product) => {
                    const qty =
                      orderItems.find(
                        (item) =>
                          item.product.product_id === product.product_id,
                      )?.qty || 0;

                    return (
                      <button
                        type="button"
                        key={product.product_id}
                        onClick={() => updateOrCreate(product)}
                        className={`min-h-[150px] rounded-xl border p-3 text-left transition ${
                          qty > 0
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <p className="mb-1 line-clamp-1 text-xs text-gray-400">
                          {product.principal_name}
                        </p>

                        <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-gray-800">
                          {product.product_name}
                        </p>

                        <p className="text-sm font-semibold text-blue-600">
                          Rp{" "}
                          {Number(product.price || 0).toLocaleString("id-ID")}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Stock:{" "}
                          {Number(product.stock || 0).toLocaleString("id-ID")}
                        </p>

                        {qty > 0 && (
                          <p className="mt-1 text-xs font-medium text-blue-500">
                            x{qty} di keranjang
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 lg:min-h-0">
            <p className="text-sm font-semibold text-gray-800">
              Keranjang order
            </p>

            <div className="flex flex-1 flex-col gap-2 overflow-y-visible lg:min-h-0 lg:overflow-y-auto">
              {orderItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Belum ada produk dipilih
                </p>
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
                      className={`rounded-xl border p-3 ${
                        qtyInvalid
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-medium text-gray-800">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Rp {price.toLocaleString("id-ID")} / pcs
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(product.product_id)}
                          className="shrink-0 text-xs text-red-500 hover:text-red-700"
                        >
                          Hapus
                        </button>
                      </div>

                      <div className="grid gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            Qty
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                qtyUpdate(
                                  product.product_id,
                                  Math.max(qtyNumber - 1, 0),
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={qtyValue}
                              onChange={(e) =>
                                qtyUpdate(product.product_id, e.target.value)
                              }
                              className={`h-10 w-20 rounded-xl border text-center text-sm font-medium focus:outline-none focus:ring-2 ${
                                qtyInvalid
                                  ? "border-red-300 focus:ring-red-400"
                                  : "border-gray-200 focus:ring-blue-500"
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                qtyUpdate(product.product_id, qtyNumber + 1)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white hover:bg-blue-700"
                            >
                              +
                            </button>
                          </div>

                          {qtyInvalid && (
                            <p className="mt-1 text-xs text-red-500">
                              Qty kosong atau 0. Isi qty atau hapus item.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">
                              Discount (%)
                            </label>

                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={discount}
                              onChange={(e) =>
                                discountUpdate(
                                  product.product_id,
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-gray-500">
                              Bonus Qty
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={bonusQty}
                              onChange={(e) =>
                                bonusQtyUpdate(
                                  product.product_id,
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs text-gray-500">
                            Subtotal
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            Rp {subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sticky bottom-0 border-t border-gray-100 bg-white pt-3">
              <div className="mb-2 flex justify-between text-xs text-gray-500">
                <span>Total item</span>
                <span>{orderItems.length} produk</span>
              </div>

              <div className="mb-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  Total
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting || orderItems.length === 0 || !selectedCustomer
                }
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Menyimpan..." : "Submit Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCustomer && (
        <CustomerSearch onClose={() => setShowCustomer(false)} />
      )}
    </>
  );
}
