import { NextResponse } from "next/server";
import { getAffiliateByEmail, signSession, verifyPassword } from "@/lib/affiliates";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const affiliate = getAffiliateByEmail(email.trim());
  // Same message either way — don't confirm which emails have accounts.
  const invalid = NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  if (!affiliate || !verifyPassword(password, affiliate.password_hash)) return invalid;
  if (affiliate.status !== "active") {
    return NextResponse.json({ error: "This account is not active." }, { status: 403 });
  }

  const response = NextResponse.json({ code: affiliate.code });
  response.cookies.set(config.affiliate.sessionCookieName, signSession(affiliate.id), {
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
