import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  getAffiliate,
  getPayouts,
  getReferredOrders,
  getStats,
  readSession,
} from "@/lib/affiliates";
import { config, COMMISSION_PCT, DISCOUNT_PCT } from "@/lib/config";
import { money } from "@/lib/money";
import { CopyField } from "@/components/CopyField";
import { LoginForm } from "./LoginForm";
import { DashboardActions } from "./DashboardActions";

export const metadata: Metadata = { title: "Affiliate dashboard" };

// Balances change on every order, so never serve this from cache.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const jar = await cookies();
  const affiliateId = readSession(jar.get(config.affiliate.sessionCookieName)?.value);
  const affiliate = affiliateId ? getAffiliate(affiliateId) : undefined;

  if (!affiliate) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Affiliate login</h1>
        <p className="mt-3 text-mist-400">Sign in to see your clicks, orders and earnings.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-mist-400">
          No account yet?{" "}
          <Link href="/affiliates" className="text-accent-400 hover:underline">
            Join the program →
          </Link>
        </p>
      </div>
    );
  }

  const stats = getStats(affiliate.id);
  const orders = getReferredOrders(affiliate.id);
  const payouts = getPayouts(affiliate.id);

  const tiles = [
    { label: "Clicks", value: stats.clicks.toLocaleString(), note: `${stats.clicks30d} in last 30 days` },
    { label: "Orders", value: stats.orders.toLocaleString(), note: `${money(stats.revenueCents)} referred revenue` },
    {
      label: "Conversion",
      value: `${(stats.conversionRate * 100).toFixed(1)}%`,
      note: "Orders per click",
    },
    {
      label: "Lifetime earned",
      value: money(stats.lifetimeCents),
      note: `at ${COMMISSION_PCT}% commission`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{affiliate.name}</h1>
          <p className="mt-1 text-mist-400">
            Code <span className="font-mono text-accent-400">{affiliate.code}</span> · joined{" "}
            {new Date(affiliate.created_at).toLocaleDateString()}
          </p>
        </div>
        <DashboardActions />
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-mist-400">
              {tile.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{tile.value}</p>
            <p className="mt-1 text-xs text-mist-400">{tile.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white">Your links</h2>
          <p className="mt-1.5 text-sm text-mist-400">
            Anyone who clicks these gets {DISCOUNT_PCT}% off and stays attributed to you for{" "}
            {config.affiliate.cookieDays} days.
          </p>
          <div className="mt-5 space-y-3">
            <CopyField label="Homepage" path={`/r/${affiliate.code}`} />
            <CopyField label="Catalog" path={`/r/${affiliate.code}?to=/products`} />
            <CopyField label="Any product" path={`/r/${affiliate.code}?to=/products/bpc-157`} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-mist-400">
            Point <span className="font-mono">?to=</span> at any path on the site to send people
            straight there with your code attached.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white">Balance</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-mist-400">Held ({config.affiliate.holdDays}-day window)</dt>
              <dd className="font-mono">{money(stats.pendingCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mist-400">Available now</dt>
              <dd className="font-mono text-accent-400">{money(stats.approvedCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-800 pt-3">
              <dt className="text-mist-400">Paid out</dt>
              <dd className="font-mono">{money(stats.paidCents)}</dd>
            </div>
          </dl>

          <DashboardActions
            variant="payout"
            available={stats.approvedCents}
            minimum={config.affiliate.payoutMinimum}
          />

          {payouts.length > 0 && (
            <div className="mt-6 border-t border-ink-800 pt-5">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-mist-400">
                Payout history
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {payouts.map((payout) => (
                  <li key={payout.id} className="flex justify-between gap-4">
                    <span className="text-mist-400">
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </span>
                    <span className="font-mono">{money(payout.amount_cents)}</span>
                    <span className="text-mist-400">{payout.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">Referred orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-mist-400">
            No orders yet. Share your link and they will show up here the moment someone buys.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 text-left font-mono text-[11px] uppercase tracking-wider text-mist-400">
                  <th className="pb-3 pr-4 font-normal">Order</th>
                  <th className="pb-3 pr-4 font-normal">Date</th>
                  <th className="pb-3 pr-4 text-right font-normal">Order total</th>
                  <th className="pb-3 pr-4 text-right font-normal">Your cut</th>
                  <th className="pb-3 text-right font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {orders.map((order) => (
                  <tr key={order.public_id}>
                    <td className="py-3 pr-4 font-mono text-mist-200">{order.public_id}</td>
                    <td className="py-3 pr-4 text-mist-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{money(order.total_cents)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-accent-400">
                      {order.amount_cents === null ? "—" : money(order.amount_cents)}
                    </td>
                    <td className="py-3 text-right text-mist-400">
                      {order.commission_status ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
