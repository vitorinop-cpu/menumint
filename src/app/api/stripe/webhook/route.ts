import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSystemRepo } from "@/lib/data";
import { getStripe, mapStripeStatus, planForPrice } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Verified Stripe webhook. Subscription state is synchronised here only —
 * the client is never trusted for plan changes.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) {
    return NextResponse.json({ error: "Stripe webhooks are not configured" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(sub, session.client_reference_id ?? session.metadata?.userId ?? null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object, null);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook]", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription, hintedUserId: string | null) {
  const repo = getSystemRepo();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = hintedUserId ?? sub.metadata?.userId ?? (await repo.findUserIdByStripeCustomer(customerId));
  if (!userId) {
    console.warn("[stripe-webhook] no user for customer", customerId);
    return;
  }
  const item = sub.items.data[0];
  const plan = planForPrice(item?.price.id) ?? "free";
  const status = mapStripeStatus(sub.status);
  const ended = status === "canceled";
  await repo.upsertSubscription({
    userId,
    plan: ended ? "free" : plan,
    status,
    source: "stripe",
    stripeCustomerId: customerId,
    stripeSubscriptionId: ended ? null : sub.id,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}
