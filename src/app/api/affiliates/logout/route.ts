import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(config.affiliate.sessionCookieName, "", { maxAge: 0, path: "/" });
  return response;
}
