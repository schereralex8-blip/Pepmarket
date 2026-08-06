"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/money";

type Confirmation = {
  publicId: string;
  totalCents: number;
  referralCode: string | null;
};

export function CartView({
  freeShippingThreshold,
  flatShipping,
  discountPct,
}: {
  freeShippingThreshold: number;
  flatShipping: number;
  discountPct: number;
}) {
  const { items, subtotalCents, setQuantity, remove, clear, ready } = useCart();
  const [referral, setReferral] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)pm_ref=([^;]+)/);
    if (match) setReferral(decodeURIComponent(match[1]));
  }, []);

  // Mirrors the server calculation so the summary matches the charge.
  const discountCents = referral ? Math.round(subtotalCents * (discountPct / 100)) : 0;
  const afterDiscount = subtotalCents - discountCents;
  const shippingCents =
    items.length === 0 || afterDiscount >= freeShippingThreshold ? 0 : flatShipping;
  const totalCents = afterDiscount + shippingCents;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          address: form.get("address"),
          acknowledged: form.get("acknowledged") === "on",
          lines: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Checkout failed.");

      setConfirmation({
        publicId: data.publicId,
        totalCents: data.totalCents,
        referralCode: data.referralCode ?? null,
      });
      clear();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="card mt-10 max-w-2xl p-8">
        <p className="font-mono text-xs uppercase tracking-wider text-accent-400">Order placed</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Thanks — you&apos;re all set.</h2>
        <p className="mt-4 leading-relaxed text-mist-400">
          Your order number is{" "}
          <span className="font-mono text-accent-400">{confirmation.publicId}</span>. A confirmation
          with tracking and the batch certificate of analysis goes out when it ships.
        </p>
        <p className="mt-3 text-mist-400">
          Total charged: <span className="font-semibold text-white">{money(confirmation.totalCents)}</span>
          {confirmation.referralCode && (
            <>
              {" "}
              · referred by{" "}
              <span className="font-mono text-accent-400">{confirmation.referralCode}</span>
            </>
          )}
        </p>
        <Link href="/products" className="btn btn-primary mt-7 px-6 py-3">
          Keep shopping
        </Link>
      </div>
    );
  }

  if (!ready) {
    return <p className="mt-10 text-mist-400">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card mt-10 max-w-lg p-8">
        <p className="text-mist-400">Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary mt-6 px-6 py-3">
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <section className="card divide-y divide-ink-800">
        {items.map((item) => (
          <div key={item.productId} className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="font-semibold text-white hover:text-accent-400"
              >
                {item.name}
              </Link>
              <p className="mt-1 font-mono text-xs text-mist-400">
                {item.size} · {money(item.priceCents)} each
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`Decrease quantity of ${item.name}`}
                className="btn btn-ghost h-8 w-8"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
              >
                −
              </button>
              <span className="w-9 text-center font-mono text-sm">{item.quantity}</span>
              <button
                type="button"
                aria-label={`Increase quantity of ${item.name}`}
                className="btn btn-ghost h-8 w-8"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
              >
                +
              </button>
            </div>

            <div className="w-24 text-right font-semibold text-white">
              {money(item.priceCents * item.quantity)}
            </div>

            <button
              type="button"
              className="text-sm text-mist-400 hover:text-red-400"
              onClick={() => remove(item.productId)}
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Summary</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-mist-400">Subtotal</dt>
            <dd>{money(subtotalCents)}</dd>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-accent-400">
              <dt>Referral discount ({referral})</dt>
              <dd>−{money(discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-mist-400">Shipping</dt>
            <dd>{shippingCents === 0 ? "Free" : money(shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-800 pt-3 text-base font-semibold text-white">
            <dt>Total</dt>
            <dd>{money(totalCents)}</dd>
          </div>
        </dl>

        {shippingCents > 0 && (
          <p className="mt-3 text-xs text-mist-400">
            Add {money(freeShippingThreshold - afterDiscount)} for free shipping.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-3">
          <input required name="name" placeholder="Full name" className="field" autoComplete="name" />
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            className="field"
            autoComplete="email"
          />
          <textarea
            required
            name="address"
            rows={3}
            placeholder="Shipping address"
            className="field resize-none"
            autoComplete="street-address"
          />

          <label className="flex gap-2.5 pt-1 text-xs leading-relaxed text-mist-400">
            <input required type="checkbox" name="acknowledged" className="mt-0.5 shrink-0" />
            <span>
              I am 21 or older and I am purchasing these products strictly for laboratory research
              use. I understand they are not for human or veterinary consumption.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
            {submitting ? "Placing order…" : `Place order · ${money(totalCents)}`}
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-mist-400">
          Demo checkout — no card is collected and no payment is taken. Wire a payment provider into{" "}
          <span className="font-mono">src/app/api/checkout/route.ts</span> before going live.
        </p>
      </section>
    </div>
  );
}
