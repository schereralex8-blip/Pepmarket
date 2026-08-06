"use client";

import { useEffect, useState } from "react";

/**
 * Shows an absolute referral URL and copies it on click. The origin is read on
 * the client so the link is correct on localhost, staging and production alike.
 */
export function CopyField({ label, path }: { label: string; path: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = `${origin}${path}`;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
      <div className="mt-1.5 flex gap-2">
        <input readOnly value={url} className="field font-mono text-xs" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className="btn btn-ghost shrink-0 px-4 text-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
