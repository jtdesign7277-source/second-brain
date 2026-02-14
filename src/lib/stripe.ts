import Stripe from "stripe";
import { getEnv } from "@/lib/env";

export const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
  typescript: true
});
