import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedProducts } from "./seed-products";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH ?? path.join(DATA_DIR, "pepmarket.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  blurb         TEXT NOT NULL,
  description   TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  size          TEXT NOT NULL,
  purity        TEXT NOT NULL,
  cas           TEXT,
  stock         INTEGER NOT NULL DEFAULT 0,
  featured      INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS affiliates (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  audience       TEXT,
  payout_method  TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clicks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  landing      TEXT,
  referrer     TEXT,
  visitor      TEXT
);
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate ON clicks(affiliate_id);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id       TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  subtotal_cents  INTEGER NOT NULL,
  discount_cents  INTEGER NOT NULL DEFAULT 0,
  shipping_cents  INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL,
  affiliate_id    INTEGER REFERENCES affiliates(id) ON DELETE SET NULL,
  referral_code   TEXT,
  status          TEXT NOT NULL DEFAULT 'paid',
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate ON orders(affiliate_id);

CREATE TABLE IF NOT EXISTS order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL REFERENCES products(id),
  name             TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS commissions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  base_cents   INTEGER NOT NULL,
  rate         REAL NOT NULL,
  amount_cents INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TEXT NOT NULL,
  mature_at    TEXT NOT NULL,
  payout_id    INTEGER REFERENCES payouts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);

CREATE TABLE IF NOT EXISTS payouts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  method       TEXT,
  status       TEXT NOT NULL DEFAULT 'requested',
  requested_at TEXT NOT NULL,
  paid_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON payouts(affiliate_id);
`;

function connect(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new Database(DB_PATH);
  // Next.js starts several workers that may all open the database at once;
  // let them queue behind each other instead of failing on a locked file.
  database.pragma("busy_timeout = 5000");
  database.exec(SCHEMA);

  const { count } = database.prepare<[], { count: number }>(
    "SELECT COUNT(*) AS count FROM products",
  ).get()!;

  if (count === 0) {
    // OR IGNORE, because two workers can both observe an empty table and race
    // to seed it. Whichever loses simply no-ops on the unique slug.
    const insert = database.prepare(`
      INSERT OR IGNORE INTO products
        (slug, name, category, blurb, description, price_cents, size, purity, cas, stock, featured)
      VALUES (@slug, @name, @category, @blurb, @description, @price_cents, @size, @purity, @cas, @stock, @featured)
    `);
    database.transaction(() => seedProducts.forEach((p) => insert.run(p)))();
  }

  return database;
}

// Next.js hot-reloads modules in dev; keep one connection on globalThis so we
// don't leak file handles across reloads.
const globalForDb = globalThis as unknown as { __pepmarketDb?: Database.Database };

function getDb(): Database.Database {
  if (!globalForDb.__pepmarketDb) globalForDb.__pepmarketDb = connect();
  return globalForDb.__pepmarketDb;
}

/**
 * Lazy on purpose. Connecting at module load meant that merely importing this
 * file — which `next build` does when it collects page data — created and
 * seeded the database, with several build workers racing to do it at once.
 * Behind this proxy the first connection happens on the first real query, so
 * builds never touch the disk and stay reproducible.
 */
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    const database = getDb();
    const value = Reflect.get(database, prop, receiver);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
