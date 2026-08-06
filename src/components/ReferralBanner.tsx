"use client";

import { useEffect, useState } from "react";

/**
 * Shows the visitor which affiliate they arrived through. The cookie is
 * deliberately readable by script — it is attribution, not a credential —
 * so the discount can be surfaced without an extra round trip.
 */
export function ReferralBanner({ discountPct }: { discountPct: number }) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)pm_ref=([^;]+)/);
    if (match) setCode(decodeURIComponent(match[1]));
  }, []);

  if (!code) return null;

  return (
    <div className="border-b border-accent-600/30 bg-accent-600/10">
      <p className="mx-auto max-w-6xl px-5 py-2 text-center text-sm text-accent-400">
        Referred by <span className="font-mono font-semibold">{code}</span> — {discountPct}% off
        applies automatically at checkout.
      </p>
    </div>
  );
}
