import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CheckoutError, placeOrder } from "@/lib/orders";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { name, email, address, acknowledged, lines } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof address !== "string" || address.trim().length < 8) {
    return NextResponse.json({ error: "Please enter a shipping address." }, { status: 400 });
  }
  if (acknowledged !== true) {
    return NextResponse.json(
      { error: "You must confirm this order is for laboratory research use." },
      { status: 400 },
    );
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Attribution comes from the cookie the /r/<code> link set — never from the
  // request body, so a client cannot assign a commission to whoever it likes.
  const jar = await cookies();
  const referralCode = jar.get(config.affiliate.cookieName)?.value ?? null;

  try {
    const order = placeOrder({
      lines: lines as { productId: number; quantity: number }[],
      name,
      email,
      address,
      referralCode,
    });

    // Payment provider goes here: create the charge before placeOrder() in a
    // real deployment, and only persist the order once the charge succeeds.

    return NextResponse.json({
      publicId: order.publicId,
      totalCents: order.totals.totalCents,
      referralCode,
    });
  } catch (cause) {
    if (cause instanceof CheckoutError) {
      return NextResponse.json({ error: cause.message }, { status: 400 });
    }
    console.error("checkout failed", cause);
    return NextResponse.json({ error: "Could not place the order." }, { status: 500 });
  }
}
