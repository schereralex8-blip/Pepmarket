# Deploying Pepmarket

## Just want a link you can send someone?

If the goal is showing the site to a person today — not launching — you don't
need to deploy anything. A tunnel puts your local dev server on a public HTTPS
URL in one command.

```bash
npm run dev                                   # terminal 1
cloudflared tunnel --url http://localhost:3000  # terminal 2
```

Install `cloudflared` first: `brew install cloudflared` on macOS, or grab a
binary from Cloudflare's releases page. No account, no signup — it prints a
`https://something-random.trycloudflare.com` URL that anyone can open.

What this is and isn't:

- The link only works while both commands are running. Close the terminal or
  shut your laptop and it dies. The URL is different every time.
- Traffic goes to *your machine*. Fine for a demo, not for customers.
- Referral links adapt automatically. The dashboard builds them from the origin
  the browser is actually on, so they show the tunnel URL, not localhost — the
  whole referral flow is demonstrable over the link.

**Turn off the demo admin token before you share a tunnel.** `/admin` falls back
to `dev-admin` in development, so anyone with your link can open
`/admin?token=dev-admin` and read every order and affiliate. Either set a real
`ADMIN_TOKEN` in `.env.local` first, or only tunnel a database with demo data
in it.

When you want a link that stays up with your laptop closed, that's a real
deploy — the rest of this document.

## Read this first: payments, not hosting, is the hard part

Hosting this app is a one-evening job. Getting paid for peptides is the part
that stops people, and it is worth resolving *before* you spend money on
infrastructure.

Mainstream processors — Stripe, PayPal, Square — restrict research chemicals,
peptides, and products marketed with health claims under their acceptable-use
policies. Some peptide sellers do get onboarded initially, because signup is
automated and nobody reads your catalog on day one. The failure mode is not
being declined at signup; it is being approved, trading for four months, and
then having the account closed during a routine review with a rolling reserve
held against chargebacks for months afterward. That is the outcome to design
against.

Realistic options, roughly in order of how most vendors in this category solve it:

- **A high-risk merchant account** through a payment provider that explicitly
  underwrites nutraceutical/research-chemical merchants. Expect higher rates
  (often 4–8% plus per-transaction fees), a rolling reserve, and an application
  that asks for your COAs, disclaimers, and refund policy. This is the durable
  answer.
- **Crypto** — no underwriting, no chargebacks, and a chunk of this customer
  base already prefers it. Cheap to add and worth having regardless.
- **ACH / e-check** for larger orders, which sidesteps card-network rules.

Whatever you choose: disclose your actual business to the processor in writing
during onboarding. An approval obtained by describing yourself as a generic
supplement store is the approval that gets reversed with your money inside it.

The rest of this document assumes you have that sorted or are testing.

## Why not Vercel

This app stores everything in a SQLite file on local disk. Vercel's serverless
functions get an ephemeral filesystem and don't share one between invocations,
so orders and affiliate accounts would silently vanish. You have two paths:

1. **Host somewhere with a persistent disk** — Fly.io, Railway, Render, or any
   VPS. Nothing in the code changes. This is the recommended path and what the
   included `Dockerfile` and `fly.toml` are for.
2. **Migrate to Postgres** and then Vercel works fine. Worth doing when you
   outgrow one machine, not before. Everything touching the database is
   confined to `src/lib/` — `db.ts`, `products.ts`, `orders.ts`, `affiliates.ts`
   — so this is a contained change, not a rewrite.

SQLite on one box will comfortably handle far more traffic than a new store
gets. Don't let anyone talk you out of it early.

## Deploying to Fly.io

```bash
# once
curl -L https://fly.io/install.sh | sh
fly auth signup

# from the repo root
fly launch --no-deploy            # edit the app name in fly.toml if prompted
fly volumes create pepmarket_data --size 1 --region iad

fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  ADMIN_TOKEN="$(openssl rand -hex 16)"

fly deploy
```

`fly secrets set` is the important one — the app refuses to issue affiliate
sessions in production without `SESSION_SECRET`, deliberately, so that it can
never fall back to a known development value.

Note `auto_stop_machines = false` in `fly.toml`. SQLite has a single writer, so
this app runs as exactly one machine. Do not scale it horizontally; if you need
more capacity, move to Postgres first.

### Railway or Render instead

Both detect the `Dockerfile` automatically. The only manual steps are the same
two ideas: attach a persistent volume mounted at `/data`, and set
`SESSION_SECRET`, `ADMIN_TOKEN`, and `DATABASE_PATH=/data/pepmarket.db` as
environment variables.

## Pointing a real domain at it

Buy the domain anywhere — Namecheap, Cloudflare Registrar and Porkbun are all
fine. Cloudflare sells at cost, which is usually cheapest.

On Fly:

```bash
fly certs add pepmarket.com
fly certs add www.pepmarket.com
fly ips list                      # note the v4 and v6 addresses
```

Then at your registrar's DNS:

| Type  | Name | Value                      |
|-------|------|----------------------------|
| A     | @    | your Fly IPv4              |
| AAAA  | @    | your Fly IPv6              |
| CNAME | www  | your-app.fly.dev           |

`fly certs check pepmarket.com` confirms it. TLS is issued automatically and
renews itself; `force_https` in `fly.toml` redirects http traffic.

DNS takes anywhere from a minute to a few hours to propagate. If the
certificate doesn't issue, it is almost always because the records haven't
propagated yet — wait before changing anything.

## Backups

The entire store is one file. Back it up on a schedule:

```bash
fly ssh console -C "sqlite3 /data/pepmarket.db '.backup /data/backup.db'"
fly sftp get /data/backup.db ./backup-$(date +%F).db
```

Use `.backup` rather than copying the file directly — a plain copy of a live
SQLite database in WAL mode can be inconsistent. For anything you'd be upset to
lose, [Litestream](https://litestream.io) streams SQLite to S3 continuously and
is built for exactly this setup.

## Launch checklist

- [ ] `SESSION_SECRET` and `ADMIN_TOKEN` set as secrets, not committed
- [ ] Volume mounted at `/data`, `DATABASE_PATH` pointing into it
- [ ] Backups scheduled and a restore actually tested once
- [ ] Payment provider integrated in `src/app/api/checkout/route.ts` — charge
      first, and only call `placeOrder()` once the charge succeeds
- [ ] Transactional email for order confirmations and COA delivery
- [ ] Rate limiting on `/api/affiliates/register` and `/api/affiliates/login`
- [ ] `/admin` behind real auth rather than a shared token
- [ ] Real product photography replacing the generated vial marks
- [ ] A lawyer has reviewed the disclaimers and the affiliate terms

That last one is not boilerplate. For this product category the marketing
language is the regulatory exposure, and your affiliates will be writing
marketing language on your behalf — which is the single most likely way this
business gets a warning letter. Budget time to police affiliate content, and
terminate the ones who make human-use claims. It's cheaper than the alternative.
