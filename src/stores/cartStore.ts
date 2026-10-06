"use client";

import { create } from "zustand";
import { Product } from "@/types/database";
import { roundPrice500 } from "@/lib/utils";

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  invoiceNumber: string;
  paymentMethod: "Tunai" | "QRIS";
  cashReceived: number;
  customerPhone: string;

  // Actions
  addItem: (product: Product) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: "Tunai" | "QRIS") => void;
  setCashReceived: (amount: number) => void;
  setCustomerPhone: (phone: string) => void;
  resetTransaction: () => void;

  // Computed helpers
  getTotalAmount: () => number;
  getTotalItems: () => number;
  getChangeAmount: () => number;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TK-${dateStr}-${randomSuffix}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  invoiceNumber: generateInvoiceNumber(),
  paymentMethod: "Tunai",
  cashReceived: 0,
  customerPhone: "",

  addItem: (product: Product) => {
    if (product.current_stock <= 0) {
      return false;
    }

    const { items } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    const unitPrice = roundPrice500(Number(product.sell_price));

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      if (existing.quantity >= product.current_stock) {
        return false; // Reached maximum available stock
      }

      const updatedItems = [...items];
      const newQty = existing.quantity + 1;
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * unitPrice,
      };
      set({ items: updatedItems });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            quantity: 1,
            subtotal: unitPrice,
          },
        ],
      });
    }

    return true;
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updated = items.map((item) => {
      if (item.product.id === productId) {
        const clampedQty = Math.min(quantity, item.product.current_stock);
        const unitPrice = roundPrice500(Number(item.product.sell_price));
        return {
          ...item,
          quantity: clampedQty,
          subtotal: clampedQty * unitPrice,
        };
      }
      return item;
    });

    set({ items: updated });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      cashReceived: 0,
      customerPhone: "",
    });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
    if (method === "QRIS") {
      set({ cashReceived: get().getTotalAmount() });
    }
  },

  setCashReceived: (amount) => {
    set({ cashReceived: amount });
  },

  setCustomerPhone: (phone) => {
    set({ customerPhone: phone });
  },

  resetTransaction: () => {
    set({
      items: [],
      invoiceNumber: generateInvoiceNumber(),
      paymentMethod: "Tunai",
      cashReceived: 0,
      customerPhone: "",
    });
  },

  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getChangeAmount: () => {
    const total = get().getTotalAmount();
    const received = get().cashReceived;
    return received - total;
  },
}));
