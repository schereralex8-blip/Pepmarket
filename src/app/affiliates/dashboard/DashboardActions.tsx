"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/money";

export function DashboardActions({
  variant = "header",
  available = 0,
  minimum = 0,
}: {
  variant?: "header" | "payout";
  available?: number;
  minimum?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (variant === "header") {
    return (
      <button
        type="button"
        disabled={busy}
        className="btn btn-ghost px-4 py-2 text-sm"
        onClick={async () => {
          setBusy(true);
          await fetch("/api/affiliates/logout", { method: "POST" });
          router.refresh();
        }}
      >
        Sign out
      </button>
    );
  }

  const eligible = available >= minimum && minimum > 0;

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy || !eligible}
        className="btn btn-primary w-full py-2.5 text-sm"
        onClick={async () => {
          setBusy(true);
          setError(null);
          setMessage(null);
          try {
            const response = await fetch("/api/affiliates/payout", { method: "POST" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "Could not request payout.");
            setMessage(`Payout of ${money(data.amountCents)} requested.`);
            router.refresh();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Something went wrong.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Requesting…" : "Request payout"}
      </button>

      {!eligible && (
        <p className="mt-2 text-center text-xs text-mist-400">
          Minimum {money(minimum)} available to withdraw.
        </p>
      )}
      {message && <p className="mt-2 text-center text-xs text-accent-400">{message}</p>}
      {error && <p className="mt-2 text-center text-xs text-red-300">{error}</p>}
    </div>
  );
}
