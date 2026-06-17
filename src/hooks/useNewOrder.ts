import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useOrderStore } from "@/store/useOrderStore";
import { Product } from "@/types/database";

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function useNewOrder() {
  const [loading, setLoading] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);

  const router = useRouter();

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
          `product_name.ilike.%${search}%,product_id.ilike.%${search}%,principal_name.ilike.%${search}%`
        )
        .order("product_name")
        .limit(30);

      if (error) {
        toast.error("Gagal mencari produk");
        setProductList([]);
      } else {
        setProductList((data as Product[]) || []);
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
        "Ada produk dengan qty kosong atau 0. Isi qty atau hapus item dulu."
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
    router.push("/salesman/dashboard");
  };

  return {
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
  };
}
