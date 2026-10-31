import type { Metadata } from "next";
import { getRestaurantContext, getRestaurantPlan } from "@/lib/services/context";
import { demoPlanSwitcherEnabled, isStripeConfigured, stripePriceFor } from "@/lib/env";
import { BillingView } from "@/components/billing/billing-view";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage(props: PageProps<"/dashboard/billing">) {
  const sp = await props.searchParams;
  const { user, restaurant } = await getRestaurantContext();
  // Billing is per account: show the signed-in user's own subscription.
  const { plan, subscription } = await getRestaurantPlan(user.id);
  const stripeReady = isStripeConfigured();
  return (
    <BillingView
      currentPlan={plan.id}
      subscription={
        subscription && {
          status: subscription.status,
          source: subscription.source,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          hasCustomer: Boolean(subscription.stripeCustomerId),
        }
      }
      stripeReady={stripeReady}
      pricesConfigured={{
        starter: Boolean(stripePriceFor("starter")),
        pro: Boolean(stripePriceFor("pro")),
        business: Boolean(stripePriceFor("business")),
      }}
      demoSwitcher={demoPlanSwitcherEnabled()}
      checkout={typeof sp.checkout === "string" ? sp.checkout : null}
      managedByOther={restaurant.ownerId !== user.id ? restaurant.name : null}
    />
  );
}
