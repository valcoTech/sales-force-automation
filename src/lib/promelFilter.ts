import { Transaction } from "@/types/database";

const PROMEL_KEYWORD = "promel";

/** Returns true if any item in the order is a Promel product */
export function hasPromelItem(order: Transaction): boolean {
  return (order.transaction_items || []).some(
    (item) =>
      item.products?.product_name?.toLowerCase().includes(PROMEL_KEYWORD) ||
      item.products?.principal_name?.toLowerCase().includes(PROMEL_KEYWORD)
  );
}

/**
 * Filter orders for Admin/Supervisor dashboards:
 * - Non-Promel orders → always visible
 * - Promel orders → only visible when apoteker has APPROVED them
 */
export function filterOrdersForAdmin(orders: Transaction[]): Transaction[] {
  return orders.filter((order) => {
    if (!hasPromelItem(order)) return true;
    return order.apoteker_status === "approved";
  });
}
