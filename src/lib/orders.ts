import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { config } from "./config";
import { getProductsByIds } from "./products";
import { getAffiliateByCode, recordCommission } from "./affiliates";

export type CartLine = { productId: number; quantity: number };

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

export type PricedLine = {
  productId: number;
  name: string;
  slug: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export class CheckoutError extends Error {}

/**
 * Re-prices the cart from the database. The client sends ids and quantities
 * only — prices, discounts and stock are never trusted from the browser.
 */
export function priceCart(lines: CartLine[], referralCode?: string | null) {
  const cleaned = lines
    .map((line) => ({
      productId: Number(line.productId),
      quantity: Math.max(0, Math.min(99, Math.floor(Number(line.quantity)))),
    }))
    .filter((line) => Number.isInteger(line.productId) && line.quantity > 0);

  if (cleaned.length === 0) throw new CheckoutError("Your cart is empty.");

  const products = getProductsByIds(cleaned.map((l) => l.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const priced: PricedLine[] = cleaned.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new CheckoutError("An item in your cart is no longer available.");
    if (product.stock < line.quantity) {
      throw new CheckoutError(`Only ${product.stock} of ${product.name} left in stock.`);
    }
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      unitPriceCents: product.price_cents,
      quantity: line.quantity,
      lineTotalCents: product.price_cents * line.quantity,
    };
  });

  const subtotalCents = priced.reduce((sum, l) => sum + l.lineTotalCents, 0);

  const affiliate = referralCode ? getAffiliateByCode(referralCode) : undefined;
  const eligible = affiliate?.status === "active" ? affiliate : undefined;
  const discountCents = eligible
    ? Math.round(subtotalCents * config.affiliate.customerDiscountRate)
    : 0;

  const afterDiscount = subtotalCents - discountCents;
  const shippingCents =
    afterDiscount >= config.freeShippingThreshold ? 0 : config.flatShipping;

  const totals: OrderTotals = {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
  };

  return { lines: priced, totals, affiliate: eligible };
}

export type PlaceOrderInput = {
  lines: CartLine[];
  email: string;
  name: string;
  address: string;
  referralCode?: string | null;
};

export function placeOrder(input: PlaceOrderInput) {
  const { lines, totals, affiliate } = priceCart(input.lines, input.referralCode);

  const publicId = `PM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const now = new Date().toISOString();

  return db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO orders (public_id, email, name, address, subtotal_cents, discount_cents,
                             shipping_cents, total_cents, affiliate_id, referral_code, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
      )
      .run(
        publicId,
        input.email.trim().toLowerCase(),
        input.name.trim(),
        input.address.trim(),
        totals.subtotalCents,
        totals.discountCents,
        totals.shippingCents,
        totals.totalCents,
        affiliate?.id ?? null,
        affiliate?.code ?? null,
        now,
      );

    const orderId = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)",
    );
    const decStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    for (const line of lines) {
      insertItem.run(orderId, line.productId, line.name, line.unitPriceCents, line.quantity);
      decStock.run(line.quantity, line.productId);
    }

    // Commission is paid on what the customer actually spent on product,
    // i.e. after their referral discount and excluding shipping.
    if (affiliate) {
      recordCommission({
        orderId,
        affiliateId: affiliate.id,
        baseCents: totals.subtotalCents - totals.discountCents,
      });
    }

    return { publicId, totals, orderId };
  })();
}

export type OrderRow = {
  id: number;
  public_id: string;
  email: string;
  name: string;
  total_cents: number;
  referral_code: string | null;
  status: string;
  created_at: string;
};

export function recentOrders(limit = 50): OrderRow[] {
  return db
    .prepare<[number], OrderRow>("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .all(limit);
}
