import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { ReferralBanner } from "@/components/ReferralBanner";
import { config, COMMISSION_PCT, DISCOUNT_PCT } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: "Pepmarket — Research Peptides, Third-Party Tested",
    template: "%s · Pepmarket",
  },
  description:
    "Research-grade peptides with batch-matched HPLC and mass-spec certificates of analysis. For laboratory research use only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <CartProvider>
          <ReferralBanner discountPct={DISCOUNT_PCT} />
          <SiteHeader />
          <main className="min-h-[70vh]">{children}</main>

          <footer className="mt-24 border-t border-ink-800 bg-ink-900">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-base font-semibold text-white">Pepmarket</p>
                <p className="mt-2 max-w-xs text-sm text-mist-400">
                  Research-grade peptides, third-party tested, shipped cold from a US facility.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Shop</p>
                <ul className="mt-3 space-y-2 text-sm text-mist-400">
                  <li><Link href="/products" className="hover:text-accent-400">All products</Link></li>
                  <li><Link href="/cart" className="hover:text-accent-400">Cart</Link></li>
                  <li><Link href="/about" className="hover:text-accent-400">How we test</Link></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Earn</p>
                <ul className="mt-3 space-y-2 text-sm text-mist-400">
                  <li>
                    <Link href="/affiliates" className="hover:text-accent-400">
                      Affiliate program ({COMMISSION_PCT}%)
                    </Link>
                  </li>
                  <li>
                    <Link href="/affiliates/dashboard" className="hover:text-accent-400">
                      Affiliate login
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Contact</p>
                <ul className="mt-3 space-y-2 text-sm text-mist-400">
                  <li>{config.supportEmail}</li>
                  <li>Mon–Fri, 9am–5pm ET</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-ink-800">
              <div className="mx-auto max-w-6xl px-5 py-6 text-xs leading-relaxed text-mist-400">
                <p className="font-semibold text-mist-200">
                  For laboratory research use only. Not for human or veterinary consumption.
                </p>
                <p className="mt-2 max-w-4xl">
                  All products are sold strictly as research chemicals for in-vitro study by
                  qualified researchers. Nothing on this site is a drug, dietary supplement, or
                  medical device, and no statement here has been evaluated by the FDA. Nothing here
                  is medical advice, and no product is offered to diagnose, treat, cure, or prevent
                  any disease. By ordering you confirm you are 21 or older and are purchasing for
                  legitimate research purposes.
                </p>
                <p className="mt-4">
                  © {new Date().getFullYear()} Pepmarket. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
