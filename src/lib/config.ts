/**
 * Single place to tune the business rules. Everything here can also be
 * overridden with an environment variable so you don't need a redeploy
 * to run a promo.
 */

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  storeName: "Pepmarket",
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@pepmarket.example",

  /** Free shipping once the subtotal (in cents) clears this. */
  freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 15_000),
  flatShipping: num(process.env.FLAT_SHIPPING, 995),

  affiliate: {
    /** Percent of the product subtotal paid to the referrer. */
    commissionRate: num(process.env.AFFILIATE_COMMISSION_RATE, 0.15),
    /** Percent off for the customer using a referral link. */
    customerDiscountRate: num(process.env.AFFILIATE_DISCOUNT_RATE, 0.1),
    /** How long a referral click stays attributed to the affiliate. */
    cookieDays: num(process.env.AFFILIATE_COOKIE_DAYS, 30),
    /** Commissions are held this long so refunds can claw them back. */
    holdDays: num(process.env.AFFILIATE_HOLD_DAYS, 30),
    /** Minimum approved balance (cents) before a payout can be requested. */
    payoutMinimum: num(process.env.AFFILIATE_PAYOUT_MINIMUM, 5_000),
    cookieName: "pm_ref",
    sessionCookieName: "pm_aff_session",
  },

  /** Guards /admin. Set ADMIN_TOKEN in production. */
  adminToken: process.env.ADMIN_TOKEN ?? "dev-admin",
} as const;

export const COMMISSION_PCT = Math.round(config.affiliate.commissionRate * 100);
export const DISCOUNT_PCT = Math.round(config.affiliate.customerDiscountRate * 100);
