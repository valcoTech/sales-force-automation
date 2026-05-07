import { create } from "zustand";
import { persist } from "zustand/middleware";

const getProductKey = (product) => product.product_id;

export const useOrderStore = create(
  persist(
    (set) => ({
      selectedCustomer: null,
      orderItems: [],

      setCustomer: (customer) => set({ selectedCustomer: customer }),

      updateOrCreate: (product) =>
        set((state) => {
          const productKey = getProductKey(product);

          const existing = state.orderItems.find(
            (item) => getProductKey(item.product) === productKey,
          );

          if (existing) {
            return {
              orderItems: state.orderItems.map((item) =>
                getProductKey(item.product) === productKey
                  ? { ...item, qty: Number(item.qty || 0) + 1 }
                  : item,
              ),
            };
          }

          return {
            orderItems: [
              ...state.orderItems,
              { product, qty: 1, discount: 0, bonus_qty: 0 },
            ],
          };
        }),

      qtyUpdate: (productKey, qty) =>
        set((state) => ({
          orderItems: state.orderItems.map((item) =>
            getProductKey(item.product) === productKey
              ? { ...item, qty }
              : item,
          ),
        })),

      discountUpdate: (productKey, discount) =>
        set((state) => ({
          orderItems: state.orderItems.map((item) =>
            getProductKey(item.product) === productKey
              ? { ...item, discount }
              : item,
          ),
        })),

      bonusQtyUpdate: (productKey, bonusQty) =>
        set((state) => ({
          orderItems: state.orderItems.map((item) =>
            getProductKey(item.product) === productKey
              ? { ...item, bonus_qty: bonusQty }
              : item,
          ),
        })),

      removeItem: (productKey) =>
        set((state) => ({
          orderItems: state.orderItems.filter(
            (item) => getProductKey(item.product) !== productKey,
          ),
        })),

      resetOrder: () =>
        set({
          selectedCustomer: null,
          orderItems: [],
        }),
    }),
    {
      name: "sales-order-draft",
      partialize: (state) => ({
        selectedCustomer: state.selectedCustomer,
        orderItems: state.orderItems,
      }),
    },
  ),
);
