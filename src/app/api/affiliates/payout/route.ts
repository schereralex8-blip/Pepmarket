import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAffiliate, readSession, requestPayout } from "@/lib/affiliates";
import { config } from "@/lib/config";
import { money } from "@/lib/money";

export async function POST() {
  const jar = await cookies();
  const affiliateId = readSession(jar.get(config.affiliate.sessionCookieName)?.value);
  if (!affiliateId || !getAffiliate(affiliateId)) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const payout = requestPayout(affiliateId);
  if (!payout) {
    return NextResponse.json(
      {
        error: `You need at least ${money(config.affiliate.payoutMinimum)} in approved commission to request a payout.`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ amountCents: payout.amount_cents, id: payout.id });
}
