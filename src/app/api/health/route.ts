import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health check for the hosting platform.
 *
 * It touches the database on purpose. A process that is up but cannot reach
 * its volume is not healthy, and that is exactly the failure worth catching
 * on a deploy — the app would otherwise serve pages and silently lose every
 * order.
 */
export async function GET() {
  try {
    db.prepare("SELECT 1").get();
    return NextResponse.json({ status: "ok", database: "reachable" });
  } catch (cause) {
    console.error("health check failed", cause);
    return NextResponse.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
