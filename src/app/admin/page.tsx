import type { Metadata } from "next";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { money } from "@/lib/money";
import { leaderboard, maturePendingCommissions } from "@/lib/affiliates";
import { recentOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Deliberately minimal: a shared-token view so you can see what the store is
 * doing without standing up a second app. Swap for real auth before this holds
 * anything you would mind leaking.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (token !== config.adminToken) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="mt-3 text-mist-400">
          Append <span className="font-mono text-accent-400">?token=…</span> to this URL. The token
          is the <span className="font-mono">ADMIN_TOKEN</span> environment variable.
        </p>
      </div>
    );
  }

  maturePendingCommissions();

  const orders = recentOrders(25);
  const affiliates = leaderboard(25);

  const totals = db
    .prepare<[], { orders: number; revenue: number | null }>(
      "SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue FROM orders WHERE status != 'refunded'",
    )
    .get()!;

  const owed = db
    .prepare<[], { total: number | null }>(
      "SELECT SUM(amount_cents) AS total FROM commissions WHERE status IN ('pending','approved')",
    )
    .get()!.total;

  const pendingPayouts = db
    .prepare<[], { id: number; name: string; amount_cents: number; method: string | null; requested_at: string }>(
      `SELECT p.id, a.name, p.amount_cents, p.method, p.requested_at
       FROM payouts p JOIN affiliates a ON a.id = p.affiliate_id
       WHERE p.status = 'requested' ORDER BY p.requested_at`,
    )
    .all();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Admin</h1>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: totals.orders.toLocaleString() },
          { label: "Revenue", value: money(totals.revenue ?? 0) },
          { label: "Commission owed", value: money(owed ?? 0) },
        ].map((tile) => (
          <div key={tile.label} className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-mist-400">
              {tile.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{tile.value}</p>
          </div>
        ))}
      </section>

      {pendingPayouts.length > 0 && (
        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-white">Payouts to send</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {pendingPayouts.map((payout) => (
              <li key={payout.id} className="flex flex-wrap justify-between gap-3">
                <span className="text-mist-200">{payout.name}</span>
                <span className="font-mono text-mist-400">{payout.method ?? "no method on file"}</span>
                <span className="font-mono text-accent-400">{money(payout.amount_cents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-6 overflow-x-auto p-6">
        <h2 className="text-lg font-semibold text-white">Recent orders</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left font-mono text-[11px] uppercase tracking-wider text-mist-400">
              <th className="pb-3 pr-4 font-normal">Order</th>
              <th className="pb-3 pr-4 font-normal">Customer</th>
              <th className="pb-3 pr-4 font-normal">Referral</th>
              <th className="pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3 pr-4 font-mono text-mist-200">{order.public_id}</td>
                <td className="py-3 pr-4 text-mist-400">{order.email}</td>
                <td className="py-3 pr-4 font-mono text-accent-400">{order.referral_code ?? "—"}</td>
                <td className="py-3 text-right font-mono">{money(order.total_cents)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-mist-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card mt-6 overflow-x-auto p-6">
        <h2 className="text-lg font-semibold text-white">Affiliates</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left font-mono text-[11px] uppercase tracking-wider text-mist-400">
              <th className="pb-3 pr-4 font-normal">Name</th>
              <th className="pb-3 pr-4 font-normal">Code</th>
              <th className="pb-3 pr-4 text-right font-normal">Orders</th>
              <th className="pb-3 text-right font-normal">Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {affiliates.map((row) => (
              <tr key={row.code}>
                <td className="py-3 pr-4 text-mist-200">{row.name}</td>
                <td className="py-3 pr-4 font-mono text-accent-400">{row.code}</td>
                <td className="py-3 pr-4 text-right font-mono">{row.orders}</td>
                <td className="py-3 text-right font-mono">{money(row.earned)}</td>
              </tr>
            ))}
            {affiliates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-mist-400">
                  No affiliates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
