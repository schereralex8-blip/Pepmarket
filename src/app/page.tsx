import Link from "next/link";
import { featuredProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { COMMISSION_PCT, DISCOUNT_PCT, config } from "@/lib/config";
import { money } from "@/lib/money";

// Stock levels move, so render per request rather than pinning the build output.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const featured = featuredProducts(4);

  return (
    <>
      <section className="bg-grid border-b border-ink-800">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-400">
            Research-grade · Third-party tested
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Peptides your data can actually stand on.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist-400">
            Every batch is assayed by an independent lab before it ships, and the certificate of
            analysis is matched to the exact vial in your hand — not to a batch from last year.
            Cold-shipped from the US, usually out the door same day.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-primary px-6 py-3">
              Browse the catalog
            </Link>
            <Link href="/affiliates" className="btn btn-ghost px-6 py-3">
              Earn {COMMISSION_PCT}% as an affiliate
            </Link>
          </div>

          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {[
              { value: "≥98%", label: "Minimum assayed purity" },
              { value: "Per-batch", label: "HPLC + mass spec COA" },
              { value: "Same day", label: "Cutoff 2pm ET, Mon–Fri" },
              { value: money(config.freeShippingThreshold), label: "Free shipping over" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-xl text-accent-400">{stat.value}</dt>
                <dd className="mt-1 text-sm text-mist-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Most ordered</h2>
            <p className="mt-2 text-mist-400">The compounds our labs reorder most.</p>
          </div>
          <Link href="/products" className="hidden text-sm text-accent-400 hover:underline sm:block">
            View all →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-400">
                Affiliate program
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Get paid {COMMISSION_PCT}% for telling people the truth about their supplier.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-mist-400">
                We would rather pay researchers, coaches and writers who already have an audience
                than pour the same money into ads. Share your link, your audience gets{" "}
                {DISCOUNT_PCT}% off, and you keep {COMMISSION_PCT}% of everything they spend —
                first order and every order after it.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  `${COMMISSION_PCT}% commission on every order, for the lifetime of the customer`,
                  `${DISCOUNT_PCT}% discount attached to your link, so it is worth clicking`,
                  `${config.affiliate.cookieDays}-day attribution window on every click`,
                  "Live dashboard: clicks, conversions, earnings, payout history",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-mist-200">
                    <span className="mt-0.5 text-accent-400">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/affiliates" className="btn btn-primary px-6 py-3">
                  Apply in 30 seconds
                </Link>
                <Link href="/affiliates/dashboard" className="btn btn-ghost px-6 py-3">
                  Affiliate login
                </Link>
              </div>
            </div>

            <div className="card p-7">
              <p className="font-mono text-xs uppercase tracking-wider text-mist-400">
                What {COMMISSION_PCT}% looks like
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { orders: "5 orders / month", value: 5 * 12000 },
                  { orders: "25 orders / month", value: 25 * 12000 },
                  { orders: "100 orders / month", value: 100 * 12000 },
                ].map((row) => (
                  <div
                    key={row.orders}
                    className="flex items-center justify-between border-b border-ink-800 pb-4 last:border-0"
                  >
                    <span className="text-mist-400">{row.orders}</span>
                    <span className="font-mono text-xl text-accent-400">
                      {money(Math.round(row.value * config.affiliate.commissionRate))}
                      <span className="text-xs text-mist-400">/mo</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-relaxed text-mist-400">
                Illustrative only, based on a {money(12000)} average order. Your actual earnings
                depend entirely on what your audience buys.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Tested per batch, not per year",
              body: "Every lot goes to an independent lab for HPLC purity and mass-spec identity confirmation. The COA in your inbox carries the lot number printed on your vial.",
            },
            {
              title: "Stored and shipped cold",
              body: "Lyophilised under vacuum, held at -20°C, and packed with a cold pack into an insulated mailer. Peptides degrade in a hot van, so we do not use one.",
            },
            {
              title: "Straight answers",
              body: "Ask us about purity, solubility, storage or a specific batch and you get a real answer from someone who has read the COA. We will not answer dosing questions.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-mist-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
