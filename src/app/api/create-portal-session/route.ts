import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const customerId = body?.customerId as string | undefined;

  if (!customerId) {
    return new Response("Missing customer id", { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: origin
  });

  return Response.json({ url: session.url });
}
