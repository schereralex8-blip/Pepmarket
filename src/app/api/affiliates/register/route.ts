import { NextResponse } from "next/server";
import {
  assertSessionConfig,
  createAffiliate,
  getAffiliateByEmail,
  signSession,
} from "@/lib/affiliates";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  try {
    assertSessionConfig();
  } catch {
    console.error("SESSION_SECRET is not configured; refusing to create an account");
    return NextResponse.json(
      { error: "Sign-up is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { name, email, password, audience, payoutMethod, agreed } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Choose a password of at least 8 characters." },
      { status: 400 },
    );
  }
  if (agreed !== true) {
    return NextResponse.json({ error: "Please accept the program terms." }, { status: 400 });
  }
  if (getAffiliateByEmail(email.trim())) {
    return NextResponse.json(
      { error: "An affiliate account already exists for that email." },
      { status: 409 },
    );
  }

  const affiliate = createAffiliate({
    name,
    email,
    password,
    audience: typeof audience === "string" ? audience : undefined,
    payoutMethod: typeof payoutMethod === "string" ? payoutMethod : undefined,
  });

  const response = NextResponse.json({ code: affiliate.code, name: affiliate.name });
  response.cookies.set(config.affiliate.sessionCookieName, signSession(affiliate.id), {
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
