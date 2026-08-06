"use client";

import { useState } from "react";
import { useCart, type CartItem } from "./CartProvider";

export function AddToCartButton({
  item,
  quantity = 1,
  className = "btn btn-primary px-5 py-2.5",
  label = "Add to cart",
}: {
  item: Omit<CartItem, "quantity">;
  quantity?: number;
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(item, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
