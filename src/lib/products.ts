import "server-only";
import { db } from "./db";

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  description: string;
  price_cents: number;
  size: string;
  purity: string;
  cas: string | null;
  stock: number;
  featured: number;
  active: number;
};

export function listProducts(category?: string): Product[] {
  if (category && category !== "All") {
    return db
      .prepare<[string], Product>(
        "SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY featured DESC, name",
      )
      .all(category);
  }
  return db
    .prepare<[], Product>("SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, name")
    .all();
}

export function listCategories(): string[] {
  return db
    .prepare<[], { category: string }>(
      "SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category",
    )
    .all()
    .map((row) => row.category);
}

export function getProduct(slug: string): Product | undefined {
  return db
    .prepare<[string], Product>("SELECT * FROM products WHERE slug = ? AND active = 1")
    .get(slug);
}

export function getProductsByIds(ids: number[]): Product[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .prepare<number[], Product>(`SELECT * FROM products WHERE id IN (${placeholders}) AND active = 1`)
    .all(...ids);
}

export function featuredProducts(limit = 4): Product[] {
  return db
    .prepare<[number], Product>(
      "SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY name LIMIT ?",
    )
    .all(limit);
}
