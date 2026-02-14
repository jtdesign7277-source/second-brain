import { stripe } from "@/lib/stripe";
import { getEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id || session.client_reference_id;
      const customerId = session.customer as string | null;

      if (userId && customerId) {
        await supabaseServer
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_status: "active"
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      await supabaseServer
        .from("profiles")
        .update({ subscription_status: status })
        .eq("stripe_customer_id", customerId);
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
