import Link from "next/link";
import { money } from "@/lib/money";
import type { Product } from "@/lib/products";
import { AddToCartButton } from "./AddToCartButton";

/** A deterministic mark per product so the grid doesn't need photography. */
function VialMark({ seed }: { seed: string }) {
  const hue = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return (
    <div
      className="grid h-28 w-full place-items-center rounded-lg border border-ink-700"
      style={{
        background: `radial-gradient(120% 90% at 30% 10%, hsl(${hue} 70% 22% / 0.9), transparent 70%), #0a0f17`,
      }}
    >
      <svg width="34" height="60" viewBox="0 0 34 60" aria-hidden="true">
        <rect x="7" y="2" width="20" height="6" rx="2" fill={`hsl(${hue} 65% 55%)`} />
        <path
          d="M9 8h16v42a8 8 0 0 1-8 8 8 8 0 0 1-8-8z"
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(203,215,232,0.45)"
          strokeWidth="1.5"
        />
        <path d="M9 36h16v14a8 8 0 0 1-16 0z" fill={`hsl(${hue} 60% 50% / 0.5)`} />
      </svg>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <article className="card flex flex-col p-4">
      <Link href={`/products/${product.slug}`} className="block">
        <VialMark seed={product.slug} />
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="font-mono text-[11px] uppercase tracking-wider text-accent-400">
          {product.category}
        </p>
        <h3 className="mt-1.5 text-base font-semibold text-white">
          <Link href={`/products/${product.slug}`} className="hover:text-accent-400">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-mist-400">{product.blurb}</p>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-mist-400">
          <div className="flex gap-1">
            <dt className="text-ink-600">SIZE</dt>
            <dd>{product.size}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-ink-600">PURITY</dt>
            <dd>{product.purity}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-800 pt-4">
          <span className="text-lg font-semibold text-white">{money(product.price_cents)}</span>
          {soldOut ? (
            <span className="text-sm text-mist-400">Out of stock</span>
          ) : (
            <AddToCartButton
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                size: product.size,
                priceCents: product.price_cents,
              }}
              className="btn btn-primary px-4 py-2 text-sm"
            />
          )}
        </div>
      </div>
    </article>
  );
}
