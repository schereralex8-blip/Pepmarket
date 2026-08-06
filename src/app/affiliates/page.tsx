import type { Metadata } from "next";
import Link from "next/link";
import { COMMISSION_PCT, DISCOUNT_PCT, config } from "@/lib/config";
import { money } from "@/lib/money";
import { leaderboard } from "@/lib/affiliates";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: `Affiliate program — earn ${COMMISSION_PCT}%`,
  description: `Share Pepmarket, earn ${COMMISSION_PCT}% of every order for the life of the customer. Your audience gets ${DISCOUNT_PCT}% off.`,
};

// The leaderboard reflects live earnings.
export const dynamic = "force-dynamic";

export default function AffiliatesPage() {
  const top = leaderboard(5).filter((row) => row.orders > 0);

  return (
    <>
      <section className="bg-grid border-b border-ink-800">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-400">
            Affiliate program
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            We spend nothing on ads. We spend {COMMISSION_PCT}% on you.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist-400">
            Every dollar a normal store burns on paid acquisition, we hand to the people who
            actually move product: researchers, coaches, forum regulars and writers whose audience
            already trusts them. You get {COMMISSION_PCT}% of everything your referrals spend — not
            just their first order, every order they ever place.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                value: `${COMMISSION_PCT}%`,
                label: "Lifetime commission",
                detail: "On product subtotal, every order, forever.",
              },
              {
                value: `${DISCOUNT_PCT}%`,
                label: "Discount for your audience",
                detail: "Baked into your link, so it converts.",
              },
              {
                value: `${config.affiliate.cookieDays} days`,
                label: "Attribution window",
                detail: "One click keeps them yours for a month.",
              },
            ].map((item) => (
              <div key={item.label} className="card p-6">
                <p className="font-mono text-3xl text-accent-400">{item.value}</p>
                <p className="mt-2 font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-sm text-mist-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">How it works</h2>
            <ol className="mt-8 space-y-6">
              {[
                {
                  title: "Sign up and get your link",
                  body: "Takes about thirty seconds. You get a referral code and a link like pepmarket.com/r/YOURCODE the moment you submit the form.",
                },
                {
                  title: "Share it wherever you already talk",
                  body: `Newsletter, video description, forum signature, group chat. You can point the link at any page — /r/YOURCODE?to=/products/bpc-157 lands people directly on a product with your ${DISCOUNT_PCT}% discount already applied.`,
                },
                {
                  title: "We track every click and order",
                  body: `A click tags that visitor to you for ${config.affiliate.cookieDays} days. When they order, the commission lands in your dashboard immediately.`,
                },
                {
                  title: "Get paid",
                  body: `Commissions clear after a ${config.affiliate.holdDays}-day refund window, then become withdrawable. Request a payout any time you are over ${money(config.affiliate.payoutMinimum)}.`,
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-500 font-mono font-bold text-ink-950">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-mist-400">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="card mt-10 p-6">
              <h3 className="font-semibold text-white">The rules, in plain language</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-mist-400">
                <li>
                  <span className="text-mist-200">Disclose the relationship.</span> The FTC requires
                  it and so do we — say you earn a commission. A plain sentence is enough.
                </li>
                <li>
                  <span className="text-mist-200">No medical or human-use claims.</span> Never tell
                  anyone a peptide treats, cures or improves anything, and never give dosing advice.
                  This is the one that gets accounts closed.
                </li>
                <li>
                  <span className="text-mist-200">Sell research use only.</span> Describe what these
                  compounds are studied for, not what they will do to a person.
                </li>
                <li>
                  <span className="text-mist-200">No paid search on our brand name</span>, no cookie
                  stuffing, no spam, no self-referred orders.
                </li>
                <li>
                  <span className="text-mist-200">Refunded orders reverse the commission.</span>{" "}
                  That is what the {config.affiliate.holdDays}-day hold is for.
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <SignupForm />

            {top.length > 0 && (
              <div className="card mt-6 p-6">
                <h3 className="font-semibold text-white">Top affiliates this season</h3>
                <ul className="mt-4 space-y-3">
                  {top.map((row, index) => (
                    <li key={row.code} className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-mist-400">#{index + 1}</span>
                        <span className="text-mist-200">{row.name}</span>
                      </span>
                      <span className="font-mono text-accent-400">{money(row.earned)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-mist-400">
              Already signed up?{" "}
              <Link href="/affiliates/dashboard" className="text-accent-400 hover:underline">
                Open your dashboard →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
