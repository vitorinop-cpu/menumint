"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CreditCard, ExternalLink, FlaskConical, Sparkles } from "lucide-react";
import type { PlanId, SubscriptionStatus } from "@/lib/domain";
import { PLANS, PLAN_ORDER, planRank } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { demoSwitchPlanAction, openPortalAction, startCheckoutAction } from "@/app/actions/billing";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassNotification } from "@/components/glass/glass-notification";
import { Badge } from "@/components/glass/primitives";

export function BillingView({
  currentPlan,
  subscription,
  stripeReady,
  pricesConfigured,
  demoSwitcher,
  checkout,
  managedByOther,
}: {
  currentPlan: PlanId;
  subscription: { status: SubscriptionStatus; source: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; hasCustomer: boolean } | null;
  stripeReady: boolean;
  pricesConfigured: Record<"starter" | "pro" | "business", boolean>;
  demoSwitcher: boolean;
  checkout: string | null;
  managedByOther: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const goCheckout = async (plan: PlanId) => {
    setBusy(plan);
    try {
      const res = await startCheckoutAction(plan);
      if (!res.ok) return toast.error(res.error);
      window.location.href = res.data.url;
    } finally {
      setBusy(null);
    }
  };
  const goPortal = async () => {
    setBusy("portal");
    try {
      const res = await openPortalAction();
      if (!res.ok) return toast.error(res.error);
      window.location.href = res.data.url;
    } finally {
      setBusy(null);
    }
  };
  const demoSwitch = async (plan: PlanId) => {
    setBusy(`demo-${plan}`);
    try {
      const res = await demoSwitchPlanAction(plan);
      if (!res.ok) return toast.error(res.error);
      toast.success(`Switched to ${PLANS[plan].name} (demo — no payment)`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const isStripeSub = subscription?.source === "stripe";

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        eyebrow="Billing"
        title="Plans & billing"
        description="Upgrade, downgrade or cancel at any time. Payments are handled securely by Stripe."
        actions={
          isStripeSub || subscription?.hasCustomer ? (
            <GlassButton variant="glass" onClick={() => void goPortal()} loading={busy === "portal"}>
              <CreditCard /> Manage billing <ExternalLink />
            </GlassButton>
          ) : undefined
        }
      />

      {checkout === "success" && (
        <GlassNotification tone="success" title="Thanks — checkout complete.">
          Your plan updates as soon as Stripe confirms the payment via webhook (usually a few seconds). Refresh if it hasn&apos;t changed yet.
        </GlassNotification>
      )}
      {checkout === "cancelled" && <GlassNotification tone="info" title="Checkout cancelled — you haven't been charged." />}
      {managedByOther && (
        <GlassNotification tone="info" title={`${managedByOther} is billed to its owner's account.`}>
          The plans below apply to restaurants you own.
        </GlassNotification>
      )}
      {!stripeReady && (
        <GlassNotification tone="warning" title="Stripe isn't connected in this environment">
          Checkout and the customer portal are disabled until <code className="rounded bg-white/70 px-1 text-[12px]">STRIPE_SECRET_KEY</code>,{" "}
          <code className="rounded bg-white/70 px-1 text-[12px]">STRIPE_WEBHOOK_SECRET</code> and price IDs are set. No payments can be taken.
        </GlassNotification>
      )}
      {subscription?.status === "past_due" && (
        <GlassNotification tone="warning" title="Your last payment failed">
          Update your card in the billing portal to keep your plan.
        </GlassNotification>
      )}

      <GlassCard className="flex flex-wrap items-center gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(150deg,#FFC6A6,#E97542)] text-white shadow-[0_6px_14px_-6px_rgb(233_117_66/0.7)]">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-espresso-500">Current plan</p>
          <p className="font-display text-2xl font-medium tracking-tight text-espresso">
            {PLANS[currentPlan].name}{" "}
            {subscription?.source === "demo" && (
              <Badge tone="champagne" className="align-middle">
                Demo · no payment
              </Badge>
            )}
          </p>
        </div>
        <div className="text-sm text-espresso-500">
          {isStripeSub && subscription?.currentPeriodEnd
            ? `${subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            : currentPlan === "free"
              ? "Free forever"
              : null}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const current = id === currentPlan;
          const higher = planRank(id) > planRank(currentPlan);
          const paid = id !== "free";
          const canCheckout = stripeReady && paid && pricesConfigured[id as "starter" | "pro" | "business"];
          return (
            <GlassCard
              key={id}
              tone={p.highlight ? "strong" : "default"}
              className={cn("flex flex-col", p.highlight && "ring-2 ring-terracotta/40", current && "ring-2 ring-mint-ink/40")}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[22px] font-medium tracking-tight text-espresso">{p.name}</h2>
                {current ? <Badge tone="mint" dot>Current</Badge> : p.highlight ? <Badge tone="terracotta">Recommended</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-espresso-500">{p.tagline}</p>
              <p className="mt-4">
                <span className="font-display text-[40px] font-medium leading-none tracking-tight text-espresso">${p.priceMonthly}</span>
                <span className="text-sm text-espresso-500"> /month</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-espresso-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-mint-ink" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-2">
                {current ? (
                  <GlassButton variant="outline" className="w-full" disabled>
                    Your plan
                  </GlassButton>
                ) : paid ? (
                  <GlassButton
                    variant={p.highlight ? "primary" : higher ? "dark" : "glass"}
                    className="w-full"
                    loading={busy === id}
                    disabled={!canCheckout}
                    onClick={() => (isStripeSub ? void goPortal() : void goCheckout(id))}
                    title={!canCheckout ? "Stripe is not configured" : undefined}
                  >
                    {higher ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                  </GlassButton>
                ) : isStripeSub ? (
                  <GlassButton variant="ghost" className="w-full" onClick={() => void goPortal()} loading={busy === "portal"} disabled={!stripeReady}>
                    Cancel subscription
                  </GlassButton>
                ) : null}
                {demoSwitcher && !current && !isStripeSub && (
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    className="w-full text-[13px]"
                    aria-label={`Demo: switch to ${p.name} without paying`}
                    loading={busy === `demo-${id}`}
                    onClick={() => void demoSwitch(id)}
                  >
                    <FlaskConical /> Demo: switch without paying
                  </GlassButton>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <p className="px-1 text-[13px] text-espresso-500">
        Prices shown are proposed and configurable in Stripe. Plan limits are enforced on the server for every change you make.
        {demoSwitcher && " The demo switcher only appears in local demo mode and never creates a payment."}
      </p>
    </div>
  );
}
