import { stripe } from "@/lib/stripe";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const priceId = getEnv("STRIPE_PRO_PRICE_ID");
  const userId = body?.userId as string | undefined;
  const email = body?.email as string | undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
    customer_email: email,
    client_reference_id: userId,
    metadata: userId ? { user_id: userId } : undefined
  });

  return Response.json({ url: session.url });
}
