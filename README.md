# Pepmarket

A storefront for selling research peptides, with a full affiliate program built in.

- **About page** — what peptides are, how batches get tested, storage, FAQ
- **Catalog** — filterable product grid and detail pages, seeded with 16 products
- **Cart & checkout** — client-side cart, server-side pricing, order records
- **Affiliate system** — referral links, click tracking, commission ledger, dashboard, payouts
- **Admin** — orders, affiliates, and payouts to send

Next.js 15 (App Router) + React 19 + Tailwind 4, with SQLite via `better-sqlite3`.
No external services required to run it.

## Running it

```bash
npm install
cp .env.example .env.local     # then fill in SESSION_SECRET and ADMIN_TOKEN
npm run dev                    # http://localhost:3000
```

Generate a secret with `openssl rand -hex 32`. In production the app refuses to
issue affiliate sessions without `SESSION_SECRET` rather than falling back to a
known dev value.

The database creates and seeds itself at `data/pepmarket.db` on first run. Delete
that file to reset the store; edit `src/lib/seed-products.ts` to change the
starting catalog.

```bash
npm run build && npm start     # production
npm run typecheck
```

## How the affiliate program works

This is the part the business runs on, so it is worth reading.

**Signing up.** `/affiliates` is the recruiting page and the sign-up form. There is
no approval queue — submitting the form creates the account and returns a working
referral code immediately (derived from the affiliate's name, e.g. Dana Whitfield
→ `DANAWHIT`, with a random suffix on collision).

**The link.** `/r/DANAWHIT` records the click, drops a 30-day attribution cookie,
and redirects. Add `?to=/products/bpc-157` to land people on any page on the site
with the code still attached. Only same-site paths are followed, so the link
cannot be turned into an open redirect.

**Attribution.** At checkout the referral code is read from the cookie the link
set — never from the request body — so a client cannot assign a commission to
whoever it likes. The customer gets 10% off and the affiliate earns 15%.

**The ledger.** Commission is calculated on the product subtotal after the
customer's discount and excluding shipping. It lands as `pending`, matures to
`approved` after a 30-day refund window, and becomes `paid` when it is bundled
into a payout. An affiliate can request a payout once approved commission clears
$50; the request sweeps every approved commission into one payout row and marks
them paid in a single transaction, so the same commission can't be withdrawn twice.

**The dashboard.** `/affiliates/dashboard` shows clicks, orders, conversion rate,
lifetime earnings, a held/available/paid balance breakdown, copyable links, the
referred-order table, and payout history.

**Admin.** `/admin?token=…` (uses `ADMIN_TOKEN`) shows revenue, commission owed,
recent orders with their referral codes, an affiliate table, and payouts to send.

Every rate and window is configurable in `src/lib/config.ts` or by environment
variable — commission rate, customer discount, cookie window, hold period,
payout minimum, shipping.

## Before you take real money

Two things are deliberately left as integration points:

1. **Payments.** Checkout records the order but takes no card. Wire a provider
   into `src/app/api/checkout/route.ts` — create the charge first and only call
   `placeOrder()` once it succeeds. Pricing, discounts and stock are already
   computed server-side from the database, so the client can't manipulate totals.
2. **Email.** Nothing is sent. Order confirmations, COA delivery and affiliate
   payout notices need a transactional email provider.

Also worth doing before launch: rate-limit the sign-up and login routes, move
`/admin` behind real auth, and put the SQLite file on persistent disk (set
`DATABASE_PATH`) — or migrate to Postgres if you outgrow it.

## Deploying

See [DEPLOYING.md](./DEPLOYING.md). Short version: this app keeps its data in a
SQLite file, so it needs a host with a persistent disk — Fly.io, Railway,
Render, or a VPS — and not a serverless platform. A `Dockerfile` and `fly.toml`
are included. Read the payments section of that document before you buy
anything; it is the part that actually blocks launches in this category.

## Compliance

The catalog is written and sold as **research chemicals for laboratory use only,
not for human or veterinary consumption**, and that framing is load-bearing:
product copy describes what a compound is studied for rather than what it does to
a person, there is no dosing guidance anywhere, checkout requires an explicit
research-use acknowledgement, and the affiliate terms require FTC disclosure and
forbid medical or human-use claims. Keep it that way — for this product category
the marketing language is the regulatory risk. Get a lawyer to review before
launch; nothing here is legal advice.

## Layout

```
src/
  app/
    page.tsx                    home
    about/                      about + FAQ
    products/                   catalog, [slug] detail
    cart/                       cart + checkout form
    affiliates/                 program page, sign-up, dashboard
    admin/                      token-gated admin
    r/[code]/                   referral link handler
    api/                        checkout, affiliate register/login/logout/payout
  components/                   cart context, header, product card, shared UI
  lib/
    config.ts                   commission rate, windows, thresholds
    db.ts                       schema + connection
    seed-products.ts            starting catalog
    products.ts orders.ts       catalog and checkout queries
    affiliates.ts               auth, codes, clicks, commissions, payouts
```
