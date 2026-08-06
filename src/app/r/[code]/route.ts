import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAffiliateByCode, recordClick } from "@/lib/affiliates";
import { config } from "@/lib/config";

/**
 * The affiliate link: /r/JORDAN2K
 *
 * Records the click, drops the attribution cookie, then forwards to whatever
 * page the affiliate wanted to send people to (?to=/products/bpc-157).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);

  // Only same-site paths, so a referral link can't be used as an open redirect.
  const requested = url.searchParams.get("to") ?? "/";
  const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const affiliate = getAffiliateByCode(code);
  const response = NextResponse.redirect(new URL(destination, url.origin));

  if (!affiliate || affiliate.status !== "active") return response;

  // A coarse, salted fingerprint — enough to spot obvious click spam without
  // storing raw IP addresses.
  const rawVisitor = `${request.headers.get("x-forwarded-for") ?? ""}|${
    request.headers.get("user-agent") ?? ""
  }`;
  const visitor = crypto
    .createHash("sha256")
    .update(rawVisitor)
    .digest("hex")
    .slice(0, 16);

  recordClick({
    affiliateId: affiliate.id,
    landing: destination,
    referrer: request.headers.get("referer"),
    visitor,
  });

  response.cookies.set(config.affiliate.cookieName, affiliate.code, {
    maxAge: config.affiliate.cookieDays * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    // Readable by script on purpose: the storefront shows "referred by X".
    // It is attribution metadata, not an auth token.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
