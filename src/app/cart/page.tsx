import type { Metadata } from "next";
import { CartView } from "./CartView";
import { config, DISCOUNT_PCT } from "@/lib/config";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your cart</h1>
      <CartView
        freeShippingThreshold={config.freeShippingThreshold}
        flatShipping={config.flatShipping}
        discountPct={DISCOUNT_PCT}
      />
    </div>
  );
}
