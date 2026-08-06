"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";

const links = [
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/affiliates", label: "Affiliates" },
];

export function SiteHeader() {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-500 font-mono text-sm font-bold text-ink-950">
            Pm
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">Pepmarket</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "text-accent-400" : "text-mist-400 hover:text-mist-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="btn btn-ghost px-3.5 py-2 text-sm">
            Cart
            <span className="rounded-md bg-ink-700 px-1.5 py-0.5 font-mono text-xs text-accent-400">
              {ready ? count : 0}
            </span>
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            className="btn btn-ghost px-3 py-2 text-sm md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-ink-800 px-5 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2.5 text-sm text-mist-400"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
