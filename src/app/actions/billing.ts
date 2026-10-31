"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getRepo, getSystemRepo } from "@/lib/data";
import { demoPlanSwitcherEnabled, isStripeConfigured, stripePriceFor } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import { fail, toFailure } from "@/lib/services/result";
import { logActivity } from "@/lib/services/restaurants";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const STRIPE_MISSING =
  "Stripe isn't connected in this environment. Add STRIPE_SECRET_KEY and price IDs to .env.local to enable checkout.";

export async function startCheckoutAction(plan: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in again.");
    const target = z.enum(["starter", "pro", "business"]).parse(plan);
    if (!isStripeConfigured()) return fail(STRIPE_MISSING);
    const price = stripePriceFor(target);
    if (!price) return fail(`No Stripe price is configured for ${PLANS[target].name} (STRIPE_PRICE_${target.toUpperCase()}).`);

    const stripe = getStripe();
    const system = getSystemRepo();
    const sub = await system.getSubscription(user.id);
    let customerId = sub?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.fullName, metadata: { userId: user.id } });
      customerId = customer.id;
      await system.upsertSubscription({
        userId: user.id,
        plan: sub?.plan ?? "free",
        status: sub?.status ?? "none",
        source: sub?.source === "stripe" ? "stripe" : "default",
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      });
    }
    if (sub?.source === "stripe" && sub.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(sub.status)) {
      // Existing subscribers change plans in the customer portal so proration is handled by Stripe.
      return openPortalAction();
    }
    const base = await origin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: user.id, plan: target } },
      metadata: { userId: user.id, plan: target },
      success_url: `${base}/dashboard/billing?checkout=success`,
      cancel_url: `${base}/dashboard/billing?checkout=cancelled`,
    });
    if (!session.url) return fail("Stripe did not return a checkout URL.");
    return { ok: true as const, data: { url: session.url } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function openPortalAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in again.");
    if (!isStripeConfigured()) return fail(STRIPE_MISSING);
    const sub = await getSystemRepo().getSubscription(user.id);
    if (!sub?.stripeCustomerId) return fail("You don't have a Stripe billing profile yet. Choose a plan first.");
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${await origin()}/dashboard/billing`,
    });
    return { ok: true as const, data: { url: session.url } };
  } catch (err) {
    return toFailure(err);
  }
}

/** DEMO MODE ONLY: switches the local plan without any payment so entitlements can be tested. */
export async function demoSwitchPlanAction(plan: unknown) {
  try {
    if (!demoPlanSwitcherEnabled()) return fail("The demo plan switcher is disabled.");
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in again.");
    const target = z.enum(["free", "starter", "pro", "business"]).parse(plan);
    const repo = getSystemRepo();
    const current = await repo.getSubscription(user.id);
    if (current?.source === "stripe") return fail("This account has a real Stripe subscription. Use the billing portal.");
    await repo.upsertSubscription({
      userId: user.id,
      plan: target,
      status: target === "free" ? "none" : "active",
      source: "demo",
      stripeCustomerId: current?.stripeCustomerId ?? null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    const restaurants = await (await getRepo()).listRestaurantsForUser(user.id);
    for (const r of restaurants.filter((x) => x.ownerId === user.id)) {
      await logActivity(repo, r.id, user.id, "plan_changed", `Switched to ${PLANS[target].name} (demo, no payment)`);
    }
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}
