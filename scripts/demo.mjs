/**
 * Fills the store with plausible demo data so the affiliate dashboard and
 * admin page have something to show.
 *
 *   npm run dev      # in one terminal — creates and seeds the database
 *   npm run demo     # in another
 *
 * Safe to re-run: it clears previous demo rows first. Products are left alone.
 */

import Database from "better-sqlite3";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "pepmarket.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(
    `No database at ${DB_PATH}.\n\n` +
      "Start the app once first so it can create and seed itself:\n" +
      "  npm run dev\n\n" +
      "Then run this again in a second terminal.",
  );
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("busy_timeout = 5000");

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
  .all()
  .map((row) => row.name);

if (!tables.includes("affiliates") || !tables.includes("products")) {
  console.error("The database exists but has no schema yet. Run `npm run dev` first.");
  process.exit(1);
}

const products = db.prepare("SELECT id, price_cents FROM products").all();
if (products.length === 0) {
  console.error("No products found. Run `npm run dev` first so the catalog seeds.");
  process.exit(1);
}

// Same scheme the app uses: scrypt with a per-user salt, stored as salt:hash.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

const DAY = 864e5;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();
const priceOf = (id) => products.find((p) => p.id === id)?.price_cents ?? 0;

const COMMISSION_RATE = 0.15;
const DISCOUNT_RATE = 0.1;
const FREE_SHIPPING = 15000;
const FLAT_SHIPPING = 995;

const DEMO_EMAILS = ["dana@example.com", "marcus@example.com", "sofia@example.com"];

const affiliates = [
  {
    code: "DANAWHIT",
    name: "Dana Whitfield",
    email: "dana@example.com",
    audience: "YouTube — 40k subscribers, lab technique",
    payout: "paypal: dana@example.com",
    clicks: 47,
  },
  {
    code: "MARCUSIW",
    name: "Marcus Iwu",
    email: "marcus@example.com",
    audience: "Newsletter, 8k readers",
    payout: "paypal: marcus@example.com",
    clicks: 19,
  },
  {
    code: "SOFIABER",
    name: "Sofia Bergman",
    email: "sofia@example.com",
    audience: "Research forum moderator",
    payout: "wise: sofia@example.com",
    clicks: 11,
  },
];

// Which affiliate, how many days ago, and what was in the basket.
const orders = [
  { code: "DANAWHIT", daysAgo: 41, buyer: ["Priya Raman", "priya@example.com", "14 Bench Road, Cambridge MA 02139"], lines: [[1, 2], [3, 1]] },
  { code: "DANAWHIT", daysAgo: 35, buyer: ["Tomas Neri", "tomas@example.com", "88 Assay Ave, Reno NV 89501"], lines: [[4, 1], [15, 2]] },
  { code: "DANAWHIT", daysAgo: 22, buyer: ["Hana Kito", "hana@example.com", "3 Cold Chain Way, Portland OR 97201"], lines: [[2, 1], [6, 1]] },
  { code: "DANAWHIT", daysAgo: 9,  buyer: ["Ade Balogun", "ade@example.com", "51 Lyophil St, Miami FL 33101"], lines: [[5, 1]] },
  { code: "DANAWHIT", daysAgo: 2,  buyer: ["Rin Sato", "rin@example.com", "7 Vial Court, Boulder CO 80301"], lines: [[1, 3], [16, 1]] },
  { code: "MARCUSIW", daysAgo: 27, buyer: ["Ivan Petrov", "ivan@example.com", "2 Column Rd, Chicago IL 60601"], lines: [[3, 1]] },
  { code: "MARCUSIW", daysAgo: 6,  buyer: ["Lena Fischer", "lena@example.com", "9 Peak Lane, Seattle WA 98101"], lines: [[9, 2]] },
  { code: "SOFIABER", daysAgo: 12, buyer: ["Nadia Haddad", "nadia@example.com", "18 Buffer Blvd, Durham NC 27701"], lines: [[11, 1]] },
  { code: null,       daysAgo: 15, buyer: ["Sam Okafor", "sam@example.com", "9 Lab Lane, Austin TX 78701"], lines: [[11, 1]] },
  { code: null,       daysAgo: 4,  buyer: ["Grace Lim", "grace@example.com", "4 Freezer Rd, Boston MA 02116"], lines: [[13, 1]] },
];

db.transaction(() => {
  // Clear any previous run. Cascades take the orders, clicks and commissions.
  const findByEmail = db.prepare("SELECT id FROM affiliates WHERE email = ?");
  for (const email of DEMO_EMAILS) {
    const existing = findByEmail.get(email);
    if (existing) {
      db.prepare("DELETE FROM orders WHERE affiliate_id = ?").run(existing.id);
      db.prepare("DELETE FROM affiliates WHERE id = ?").run(existing.id);
    }
  }

  const ids = new Map();
  const insertAffiliate = db.prepare(
    `INSERT INTO affiliates (code, name, email, password_hash, audience, payout_method, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
  );
  const insertClick = db.prepare(
    "INSERT INTO clicks (affiliate_id, created_at, landing, referrer, visitor) VALUES (?, ?, ?, ?, ?)",
  );

  for (const affiliate of affiliates) {
    const info = insertAffiliate.run(
      affiliate.code,
      affiliate.name,
      affiliate.email,
      hashPassword("demo1234"),
      affiliate.audience,
      affiliate.payout,
      iso(60),
    );
    ids.set(affiliate.code, Number(info.lastInsertRowid));

    for (let i = 0; i < affiliate.clicks; i++) {
      insertClick.run(
        ids.get(affiliate.code),
        iso(Math.round(45 - (i / affiliate.clicks) * 44)),
        i % 3 === 0 ? "/products/bpc-157" : "/",
        null,
        crypto.randomBytes(8).toString("hex"),
      );
    }
  }

  const insertOrder = db.prepare(
    `INSERT INTO orders (public_id, email, name, address, subtotal_cents, discount_cents,
                         shipping_cents, total_cents, affiliate_id, referral_code, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)",
  );
  const insertCommission = db.prepare(
    `INSERT INTO commissions (order_id, affiliate_id, base_cents, rate, amount_cents, status, created_at, mature_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const productName = db.prepare("SELECT name FROM products WHERE id = ?");

  for (const order of orders) {
    const subtotal = order.lines.reduce((sum, [id, qty]) => sum + priceOf(id) * qty, 0);
    const discount = order.code ? Math.round(subtotal * DISCOUNT_RATE) : 0;
    const shipping = subtotal - discount >= FREE_SHIPPING ? 0 : FLAT_SHIPPING;
    const affiliateId = order.code ? ids.get(order.code) : null;

    const info = insertOrder.run(
      `PM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      order.buyer[1],
      order.buyer[0],
      order.buyer[2],
      subtotal,
      discount,
      shipping,
      subtotal - discount + shipping,
      affiliateId,
      order.code,
      iso(order.daysAgo),
    );
    const orderId = Number(info.lastInsertRowid);

    for (const [id, qty] of order.lines) {
      insertItem.run(orderId, id, productName.get(id)?.name ?? "Item", priceOf(id), qty);
    }

    if (affiliateId) {
      const base = subtotal - discount;
      // Anything older than the 30-day hold has already cleared.
      const status = order.daysAgo > 30 ? "approved" : "pending";
      insertCommission.run(
        orderId,
        affiliateId,
        base,
        COMMISSION_RATE,
        Math.round(base * COMMISSION_RATE),
        status,
        iso(order.daysAgo),
        iso(order.daysAgo - 30),
      );
    }
  }

  // Give Dana one settled payout so the history panel isn't empty.
  const danaId = ids.get("DANAWHIT");
  const oldest = db
    .prepare(
      "SELECT id, amount_cents FROM commissions WHERE affiliate_id = ? AND status = 'approved' ORDER BY created_at LIMIT 1",
    )
    .get(danaId);

  if (oldest) {
    const payout = db
      .prepare(
        `INSERT INTO payouts (affiliate_id, amount_cents, method, status, requested_at, paid_at)
         VALUES (?, ?, ?, 'paid', ?, ?)`,
      )
      .run(danaId, oldest.amount_cents, "paypal: dana@example.com", iso(21), iso(19));
    db.prepare("UPDATE commissions SET status = 'paid', payout_id = ? WHERE id = ?").run(
      Number(payout.lastInsertRowid),
      oldest.id,
    );
  }
})();

const totals = db
  .prepare("SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue FROM orders")
  .get();

console.log(`Demo data loaded: 3 affiliates, ${totals.orders} orders, $${((totals.revenue ?? 0) / 100).toFixed(2)} revenue.

Sign in to the affiliate dashboard at /affiliates/dashboard
  email     dana@example.com
  password  demo1234

Admin is at /admin?token=dev-admin`);
