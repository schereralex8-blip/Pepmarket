# Deploying Pepmarket

## Just want a link you can send someone?

If the goal is showing the site to a person today — not launching — you don't
need to deploy anything:

```bash
npm run share
```

That starts the store, opens a Cloudflare quick tunnel in front of it, and
prints a `https://something-random.trycloudflare.com` link anyone can open.
Ctrl-C stops both.

It needs `cloudflared`, which is a single binary and no account:

```
macOS         brew install cloudflared
Windows       winget install --id Cloudflare.cloudflared
Linux/other   https://github.com/cloudflare/cloudflared/releases
```

Already have it somewhere unusual? `CLOUDFLARED=/path/to/cloudflared npm run share`.

The script also mints a private `ADMIN_TOKEN` into `.env.local` the first time
it runs, because `/admin` otherwise falls back to a value published in this
repo — see the warning below.

What this is and isn't:

- The link only works while both commands are running. Close the terminal or
  shut your laptop and it dies. The URL is different every time.
- Traffic goes to *your machine*. Fine for a demo, not for customers.
- Referral links adapt automatically. The dashboard builds them from the origin
  the browser is actually on, so they show the tunnel URL, not localhost — the
  whole referral flow is demonstrable over the link.

**On the admin token.** `/admin` falls back to `dev-admin` in development, and
a tunnel is public — so without a real token, anyone holding your link can read
every order and affiliate. `npm run share` generates one into `.env.local`
automatically and prints the admin URL with it. If you tunnel by hand instead,
set `ADMIN_TOKEN` yourself first.

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
curl -L https://fly.io/install.sh | sh    # once
fly auth login                            # opens your browser

./scripts/deploy-fly.sh
```

The script does the whole first-time setup: creates the app and the volume,
generates `SESSION_SECRET` and `ADMIN_TOKEN` and stores them as Fly secrets,
then deploys. It checks each step before doing it, so re-running it is safe —
it skips whatever already exists.

Two things before you run it:

- **Change the app name in `fly.toml`.** Fly app names are globally unique and
  `pepmarket` is almost certainly taken. Pick something like
  `pepmarket-<yourname>`. The URL becomes `https://<that>.fly.dev`.
- **It creates billable resources** — one small VM and a 1GB volume, a few
  dollars a month. It shows you what it will create and waits for a yes.

Save the admin token it prints. It is stored as a Fly secret, so it cannot be
read back out; if you lose it, set a new one with
`fly secrets set ADMIN_TOKEN=…`.

The secrets matter: the app deliberately refuses to issue affiliate sessions in
production without `SESSION_SECRET`, rather than falling back to a development
value that is published in this repository.

### Prefer to do it by hand on Fly

```bash
fly launch --no-deploy
fly volumes create pepmarket_data --size 1 --region iad
fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  ADMIN_TOKEN="$(openssl rand -hex 16)"
fly deploy --remote-only
```

`--remote-only` builds on Fly's builders, so you don't need Docker locally.

### Deploying automatically on push

`.github/workflows/fly-deploy.yml` deploys every push to `main`. To switch it
on, once:

```bash
fly tokens create deploy -x 999999h
```

Add the printed token to the repository under **Settings → Secrets and
variables → Actions** as `FLY_API_TOKEN`. It lives in GitHub and is never
needed anywhere else.

## Deploying to Railway instead

Nothing here is Fly-specific — Fly is just what the included script automates.
Railway runs the same `Dockerfile`, and `railway.json` already pins the build
and health check, so setup is a handful of clicks:

1. **New Project → Deploy from GitHub repo**, and pick this repository.
   Railway reads `railway.json` and builds the Dockerfile.
2. **Add a volume.** Open the service → **Variables/Data → Add Volume**, mount
   path `/data`. Do this *before* you send any real traffic — without it, the
   database is written into the container filesystem and is silently erased on
   the next deploy.
3. **Set variables** on the service:

   ```
   SESSION_SECRET   a long random string (openssl rand -hex 32)
   ADMIN_TOKEN      another random string
   DATABASE_PATH    /data/pepmarket.db
   ```

   Don't set `PORT` — Railway assigns one and the app reads it.
4. **Generate a domain** under **Settings → Networking**, or add a custom one
   and point a CNAME at the target Railway shows you. TLS is automatic.

Railway redeploys on every push to the connected branch, so there is no CI
workflow to configure — the GitHub Actions file is for Fly only.

**Keep replicas at 1.** `railway.json` sets `numReplicas: 1` deliberately.
SQLite has a single writer; a second replica gets its own volume and its own
divergent copy of your orders. If you need more than one instance, migrate to
Postgres first — Railway makes that easy, and all the database code is confined
to `src/lib/`.

### Fly or Railway?

Either is fine for this app. Railway has the friendlier UI and you can do the
whole thing in a browser. Fly is cheaper at small sizes, gives finer control
over regions and machines, and is fully scriptable — which is why the automated
setup targets it. Pick whichever you'll actually maintain.

## Health checks

Both platforms watch `/api/health`, which does a real query rather than just
confirming the process is alive:

```json
{ "status": "ok", "database": "reachable" }
```

It returns **503** when the database can't be reached — the exact failure a
missing or unmounted volume produces. Without that, a broken deploy would keep
serving pages and quietly drop every order instead of being rolled back.

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
