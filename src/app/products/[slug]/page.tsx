import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/products";
import { money } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { config } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.blurb };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = listProducts(product.category)
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  const specs = [
    ["Quantity", product.size],
    ["Assayed purity", product.purity],
    ["CAS number", product.cas ?? "—"],
    ["Form", product.category === "Lab Supplies" ? "As described" : "Lyophilised powder"],
    ["Storage", product.category === "Lab Supplies" ? "Room temperature" : "-20°C, protect from light"],
    ["Certificate", "HPLC + mass spec, lot-matched"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <nav className="text-sm text-mist-400">
        <Link href="/products" className="hover:text-accent-400">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="hover:text-accent-400"
        >
          {product.category}
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div
          className="card grid h-80 place-items-center lg:h-[26rem]"
          style={{
            background:
              "radial-gradient(120% 90% at 30% 10%, rgba(18,199,149,0.16), transparent 65%), #0e1521",
          }}
        >
          <svg width="110" height="200" viewBox="0 0 34 60" aria-hidden="true">
            <rect x="7" y="2" width="20" height="6" rx="2" fill="#12c795" />
            <path
              d="M9 8h16v42a8 8 0 0 1-8 8 8 8 0 0 1-8-8z"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(203,215,232,0.45)"
              strokeWidth="1.2"
            />
            <path d="M9 36h16v14a8 8 0 0 1-16 0z" fill="rgba(18,199,149,0.35)" />
          </svg>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent-400">
            {product.category}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 text-3xl font-semibold text-white">{money(product.price_cents)}</p>
          <p className="mt-1 text-sm text-mist-400">
            {product.stock > 0 ? (
              <>
                <span className="text-accent-400">In stock</span> · {product.stock} vials available
              </>
            ) : (
              "Currently out of stock"
            )}
          </p>

          <p className="mt-6 leading-relaxed text-mist-200">{product.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {product.stock > 0 ? (
              <AddToCartButton
                item={{
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  size: product.size,
                  priceCents: product.price_cents,
                }}
                className="btn btn-primary px-7 py-3"
              />
            ) : (
              <button type="button" disabled className="btn btn-primary px-7 py-3">
                Out of stock
              </button>
            )}
            <Link href="/cart" className="btn btn-ghost px-7 py-3">
              View cart
            </Link>
          </div>

          <p className="mt-4 text-sm text-mist-400">
            Free shipping over {money(config.freeShippingThreshold)} · ships same day before 2pm ET
          </p>

          <dl className="mt-9 divide-y divide-ink-800 border-y border-ink-800">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-mist-400">{label}</dt>
                <dd className="text-right font-mono text-mist-200">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 rounded-lg border border-ink-700 bg-ink-900 p-4 text-xs leading-relaxed text-mist-400">
            <span className="font-semibold text-mist-200">Research use only.</span> This product is
            supplied strictly for laboratory research by qualified professionals. It is not a drug,
            supplement, or medical device, has not been evaluated by the FDA, and is not for human
            or veterinary consumption. We do not provide dosing guidance.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-semibold text-white">More in {product.category}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
