import type { Metadata } from "next";
import Link from "next/link";
import { listCategories, listProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Research peptides with per-batch HPLC and mass-spec certificates of analysis. For laboratory research use only.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = category ?? "All";
  const categories = ["All", ...listCategories()];
  const products = listProducts(selected);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Catalog</h1>
        <p className="mt-3 max-w-2xl text-mist-400">
          Every listing ships with the certificate of analysis for its own lot. Sold for laboratory
          research use only.
        </p>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2">
        {categories.map((item) => {
          const active = item === selected;
          return (
            <Link
              key={item}
              href={item === "All" ? "/products" : `/products?category=${encodeURIComponent(item)}`}
              className={`rounded-lg border px-3.5 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent-500 bg-accent-500/10 text-accent-400"
                  : "border-ink-700 text-mist-400 hover:border-ink-600 hover:text-mist-200"
              }`}
            >
              {item}
            </Link>
          );
        })}
      </nav>

      {products.length === 0 ? (
        <p className="mt-16 text-mist-400">Nothing in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
