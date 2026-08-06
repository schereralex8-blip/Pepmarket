import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { config } from "./config";

export type Affiliate = {
  id: number;
  code: string;
  name: string;
  email: string;
  password_hash: string;
  audience: string | null;
  payout_method: string | null;
  status: string;
  created_at: string;
};

export type Commission = {
  id: number;
  order_id: number;
  affiliate_id: number;
  base_cents: number;
  rate: number;
  amount_cents: number;
  status: "pending" | "approved" | "paid" | "void";
  created_at: string;
  mature_at: string;
  payout_id: number | null;
};

/* ------------------------------------------------------------------ *
 * Passwords — scrypt with a per-user salt. No plaintext ever stored.
 * ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  if (expectedBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

/* ------------------------------------------------------------------ *
 * Sessions — HMAC-signed cookie value, no server-side session table.
 * ------------------------------------------------------------------ */

/**
 * Resolved per call rather than at module load: a build must not fail just
 * because the build machine has no secret, but a running production server
 * must never fall back to the dev value.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "dev-only-insecure-secret";
}

/**
 * Fail before writing anything. Sign-up creates the account row and only then
 * signs a session, so a missing secret would otherwise leave an orphaned
 * account behind — and permanently burn that email address for the applicant.
 */
export function assertSessionConfig(): void {
  sessionSecret();
}

export function signSession(affiliateId: number): string {
  const payload = `${affiliateId}.${Date.now()}`;
  const sig = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function readSession(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, issued, sig] = parts;
  const expected = crypto
    .createHmac("sha256", sessionSecret())
    .update(`${id}.${issued}`)
    .digest("hex");
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  // 30-day session lifetime.
  if (Date.now() - Number(issued) > 30 * 864e5) return null;
  const affiliateId = Number(id);
  return Number.isInteger(affiliateId) ? affiliateId : null;
}

/* ------------------------------------------------------------------ *
 * Referral codes
 * ------------------------------------------------------------------ */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0, I/1 — codes get read aloud

/** Turn a name into a memorable code, falling back to random if it collides. */
export function generateCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const candidates = base.length >= 3 ? [base] : [];
  for (let i = 0; i < 20; i++) {
    const suffix = Array.from(
      crypto.randomBytes(4),
      (byte) => ALPHABET[byte % ALPHABET.length],
    ).join("");
    candidates.push(base.length >= 3 ? `${base}${suffix.slice(0, 2)}` : suffix);
  }

  for (const candidate of candidates) {
    if (!getAffiliateByCode(candidate)) return candidate;
  }
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

export function getAffiliateByCode(code: string): Affiliate | undefined {
  return db
    .prepare<[string], Affiliate>("SELECT * FROM affiliates WHERE code = ? COLLATE NOCASE")
    .get(code);
}

export function getAffiliateByEmail(email: string): Affiliate | undefined {
  return db
    .prepare<[string], Affiliate>("SELECT * FROM affiliates WHERE email = ? COLLATE NOCASE")
    .get(email);
}

export function getAffiliate(id: number): Affiliate | undefined {
  return db.prepare<[number], Affiliate>("SELECT * FROM affiliates WHERE id = ?").get(id);
}

export function createAffiliate(input: {
  name: string;
  email: string;
  password: string;
  audience?: string;
  payoutMethod?: string;
}): Affiliate {
  const code = generateCode(input.name);
  const info = db
    .prepare(
      `INSERT INTO affiliates (code, name, email, password_hash, audience, payout_method, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    )
    .run(
      code,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
      input.audience?.trim() || null,
      input.payoutMethod?.trim() || null,
      new Date().toISOString(),
    );
  return getAffiliate(Number(info.lastInsertRowid))!;
}

/* ------------------------------------------------------------------ *
 * Click tracking
 * ------------------------------------------------------------------ */

export function recordClick(input: {
  affiliateId: number;
  landing: string | null;
  referrer: string | null;
  visitor: string | null;
}): void {
  db.prepare(
    "INSERT INTO clicks (affiliate_id, created_at, landing, referrer, visitor) VALUES (?, ?, ?, ?, ?)",
  ).run(
    input.affiliateId,
    new Date().toISOString(),
    input.landing,
    input.referrer,
    input.visitor,
  );
}

/* ------------------------------------------------------------------ *
 * Commissions
 * ------------------------------------------------------------------ */

/**
 * Promote held commissions to approved once the refund window has closed.
 * Cheap enough to call on any page that displays a balance.
 */
export function maturePendingCommissions(): void {
  db.prepare(
    "UPDATE commissions SET status = 'approved' WHERE status = 'pending' AND mature_at <= ?",
  ).run(new Date().toISOString());
}

export function recordCommission(input: {
  orderId: number;
  affiliateId: number;
  baseCents: number;
}): void {
  const rate = config.affiliate.commissionRate;
  const amount = Math.round(input.baseCents * rate);
  const now = new Date();
  const mature = new Date(now.getTime() + config.affiliate.holdDays * 864e5);
  db.prepare(
    `INSERT INTO commissions (order_id, affiliate_id, base_cents, rate, amount_cents, status, created_at, mature_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).run(
    input.orderId,
    input.affiliateId,
    input.baseCents,
    rate,
    amount,
    now.toISOString(),
    mature.toISOString(),
  );
}

export type AffiliateStats = {
  clicks: number;
  clicks30d: number;
  orders: number;
  revenueCents: number;
  conversionRate: number;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  lifetimeCents: number;
};

export function getStats(affiliateId: number): AffiliateStats {
  maturePendingCommissions();

  const since = new Date(Date.now() - 30 * 864e5).toISOString();

  const clicks = db
    .prepare<[number], { n: number }>("SELECT COUNT(*) AS n FROM clicks WHERE affiliate_id = ?")
    .get(affiliateId)!.n;

  const clicks30d = db
    .prepare<[number, string], { n: number }>(
      "SELECT COUNT(*) AS n FROM clicks WHERE affiliate_id = ? AND created_at >= ?",
    )
    .get(affiliateId, since)!.n;

  const orderAgg = db
    .prepare<[number], { n: number; revenue: number | null }>(
      "SELECT COUNT(*) AS n, SUM(total_cents) AS revenue FROM orders WHERE affiliate_id = ? AND status != 'refunded'",
    )
    .get(affiliateId)!;

  const byStatus = db
    .prepare<[number], { status: string; total: number }>(
      "SELECT status, SUM(amount_cents) AS total FROM commissions WHERE affiliate_id = ? GROUP BY status",
    )
    .all(affiliateId);

  const bucket = (status: string) =>
    byStatus.find((row) => row.status === status)?.total ?? 0;

  const pendingCents = bucket("pending");
  const approvedCents = bucket("approved");
  const paidCents = bucket("paid");

  return {
    clicks,
    clicks30d,
    orders: orderAgg.n,
    revenueCents: orderAgg.revenue ?? 0,
    conversionRate: clicks > 0 ? orderAgg.n / clicks : 0,
    pendingCents,
    approvedCents,
    paidCents,
    lifetimeCents: pendingCents + approvedCents + paidCents,
  };
}

export type ReferredOrder = {
  public_id: string;
  created_at: string;
  total_cents: number;
  amount_cents: number | null;
  commission_status: string | null;
};

export function getReferredOrders(affiliateId: number, limit = 25): ReferredOrder[] {
  return db
    .prepare<[number, number], ReferredOrder>(
      `SELECT o.public_id, o.created_at, o.total_cents, c.amount_cents, c.status AS commission_status
       FROM orders o
       LEFT JOIN commissions c ON c.order_id = o.id
       WHERE o.affiliate_id = ?
       ORDER BY o.created_at DESC
       LIMIT ?`,
    )
    .all(affiliateId, limit);
}

export type Payout = {
  id: number;
  affiliate_id: number;
  amount_cents: number;
  method: string | null;
  status: string;
  requested_at: string;
  paid_at: string | null;
};

export function getPayouts(affiliateId: number): Payout[] {
  return db
    .prepare<[number], Payout>(
      "SELECT * FROM payouts WHERE affiliate_id = ? ORDER BY requested_at DESC",
    )
    .all(affiliateId);
}

/**
 * Bundle every approved commission into a payout request. Returns null when
 * the affiliate is under the minimum so the caller can explain why.
 */
export function requestPayout(affiliateId: number): Payout | null {
  const affiliate = getAffiliate(affiliateId);
  if (!affiliate) return null;

  maturePendingCommissions();

  return db.transaction(() => {
    const approved = db
      .prepare<[number], Commission>(
        "SELECT * FROM commissions WHERE affiliate_id = ? AND status = 'approved'",
      )
      .all(affiliateId);

    const total = approved.reduce((sum, c) => sum + c.amount_cents, 0);
    if (total < config.affiliate.payoutMinimum) return null;

    const info = db
      .prepare(
        "INSERT INTO payouts (affiliate_id, amount_cents, method, status, requested_at) VALUES (?, ?, ?, 'requested', ?)",
      )
      .run(affiliateId, total, affiliate.payout_method, new Date().toISOString());

    const payoutId = Number(info.lastInsertRowid);
    const mark = db.prepare("UPDATE commissions SET status = 'paid', payout_id = ? WHERE id = ?");
    approved.forEach((c) => mark.run(payoutId, c.id));

    return db.prepare<[number], Payout>("SELECT * FROM payouts WHERE id = ?").get(payoutId)!;
  })();
}

export function leaderboard(limit = 10) {
  maturePendingCommissions();
  return db
    .prepare<[number], { name: string; code: string; orders: number; earned: number }>(
      `SELECT a.name, a.code,
              COUNT(DISTINCT o.id) AS orders,
              COALESCE(SUM(c.amount_cents), 0) AS earned
       FROM affiliates a
       LEFT JOIN orders o ON o.affiliate_id = a.id AND o.status != 'refunded'
       LEFT JOIN commissions c ON c.affiliate_id = a.id AND c.status != 'void'
       WHERE a.status = 'active'
       GROUP BY a.id
       ORDER BY earned DESC, orders DESC
       LIMIT ?`,
    )
    .all(limit);
}
