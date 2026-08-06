"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyField } from "@/components/CopyField";

export function SignupForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string; name: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/affiliates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          audience: form.get("audience"),
          payoutMethod: form.get("payoutMethod"),
          agreed: form.get("agreed") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sign-up failed.");
      setCreated({ code: data.code, name: data.name });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="card border-accent-600/40 p-7">
        <p className="font-mono text-xs uppercase tracking-wider text-accent-400">You&apos;re in</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Welcome aboard, {created.name.split(" ")[0]}.
        </h2>
        <p className="mt-3 text-mist-400">
          Your referral code is{" "}
          <span className="font-mono font-semibold text-accent-400">{created.code}</span>. Here is
          the link to share:
        </p>

        <div className="mt-5 space-y-3">
          <CopyField label="Your link" path={`/r/${created.code}`} />
          <CopyField
            label="Straight to a product"
            path={`/r/${created.code}?to=/products/bpc-157`}
          />
        </div>

        <Link href="/affiliates/dashboard" className="btn btn-primary mt-7 w-full py-3">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-7">
      <h2 className="text-xl font-semibold text-white">Join the program</h2>
      <p className="mt-2 text-sm text-mist-400">
        No approval queue, no minimum following. Your link works immediately.
      </p>

      <div className="mt-6 space-y-3">
        <input required name="name" placeholder="Full name" className="field" autoComplete="name" />
        <input
          required
          type="email"
          name="email"
          placeholder="Email"
          className="field"
          autoComplete="email"
        />
        <input
          required
          type="password"
          name="password"
          minLength={8}
          placeholder="Password (8+ characters)"
          className="field"
          autoComplete="new-password"
        />
        <input
          name="audience"
          placeholder="Where will you share? (optional)"
          className="field"
        />
        <input
          name="payoutMethod"
          placeholder="Payout details — PayPal email, etc. (optional)"
          className="field"
        />

        <label className="flex gap-2.5 pt-1 text-xs leading-relaxed text-mist-400">
          <input required type="checkbox" name="agreed" className="mt-0.5 shrink-0" />
          <span>
            I agree to disclose that I earn a commission, and I will not make medical, human-use or
            dosing claims about any product I promote.
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn btn-primary mt-5 w-full py-3">
        {submitting ? "Creating your link…" : "Get my referral link"}
      </button>
    </form>
  );
}
