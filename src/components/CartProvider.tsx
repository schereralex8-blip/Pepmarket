"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  size: string;
  priceCents: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pepmarket.cart.v1";

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "number" && typeof item?.quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Load after mount so server and client render the same empty cart first.
  useEffect(() => {
    setItems(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const clamp = (n: number) => Math.max(1, Math.min(99, Math.floor(n)));
    return {
      items,
      ready,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalCents: items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
      add: (item, quantity = 1) =>
        setItems((current) => {
          const existing = current.find((entry) => entry.productId === item.productId);
          if (existing) {
            return current.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, quantity: clamp(entry.quantity + quantity) }
                : entry,
            );
          }
          return [...current, { ...item, quantity: clamp(quantity) }];
        }),
      setQuantity: (productId, quantity) =>
        setItems((current) =>
          quantity <= 0
            ? current.filter((entry) => entry.productId !== productId)
            : current.map((entry) =>
                entry.productId === productId ? { ...entry, quantity: clamp(quantity) } : entry,
              ),
        ),
      remove: (productId) =>
        setItems((current) => current.filter((entry) => entry.productId !== productId)),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
