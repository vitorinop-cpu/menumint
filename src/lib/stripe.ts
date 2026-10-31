import "server-only";
import Stripe from "stripe";
import type { PlanId, SubscriptionStatus } from "./domain";
import { stripePriceFor } from "./env";

let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  client ??= new Stripe(key, { appInfo: { name: "MenuMint" } });
  return client;
}

export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const plan of ["starter", "pro", "business"] as const) {
    if (stripePriceFor(plan) === priceId) return plan;
  }
  return null;
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "unpaid":
      return status as SubscriptionStatus;
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "past_due";
    default:
      return "none";
  }
}
