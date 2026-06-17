export type UserRole = "salesman" | "supervisor" | "admin_sales" | "admin_claim" | "apoteker";

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  price: number;
  stock: number;
  principal_name?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  qty: number;
  bonus_qty: number;
  price_at_time: number;
  discount: number;
  subtotal: number;
  products?: Product;
}

export interface Transaction {
  id: string;
  created_at: string;
  date: string;
  customer_id: string;
  salesman_id: string;
  total_amount: number;
  status: "pending" | "proses" | "done" | "reject";
  claim_status: "pending" | "proses" | "done" | "reject";
  // Apoteker approval fields for Promel products
  apoteker_status?: "pending" | "approved" | "rejected" | null;
  apoteker_note?: string | null;
  claim_reject_reason?: string | null;
  invoice_number?: string;
  customers?: Customer;
  transaction_items?: TransactionItem[];
  salesman?: UserProfile | null;
}
