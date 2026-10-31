import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[30%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_198_166/0.55),transparent)] blur-2xl" />
      </div>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          align="center"
          title={
            <>
              Simple plans. <Accent>Start free.</Accent>
            </>
          }
          lede="Publish your first menu for free, upgrade when you want more menus, templates and insights. Cancel anytime."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {PLAN_ORDER.map((id, i) => {
            const plan = PLANS[id];
            const hl = Boolean(plan.highlight);
            return (
              <Reveal as="li" key={id} delay={i * 0.06} className="h-full">
                <article
                  aria-labelledby={`plan-${id}`}
                  className={cn(
                    "relative flex h-full flex-col rounded-[28px] p-6 transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 sm:p-7",
                    hl
                      ? "bg-[linear-gradient(160deg,#3a2c25_0%,#241B18_60%,#2e1d16_100%)] text-ivory shadow-[0_40px_80px_-30px_rgb(36_27_24/0.6)] ring-1 ring-white/10"
                      : "glass glass-rim hover:shadow-[var(--shadow-lift)]",
                  )}
                >
                  {hl && (
                    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-terracotta/35 blur-[70px]" />
                    </div>
                  )}
                  <div className="relative flex items-center justify-between gap-2">
                    <h3 id={`plan-${id}`} className={cn("text-[17px] font-semibold tracking-[-0.01em]", hl ? "text-ivory" : "text-espresso")}>
                      {plan.name}
                    </h3>
                    {hl && (
                      <span className="rounded-full bg-peach px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-espresso">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className={cn("relative mt-1 text-[14px]", hl ? "text-ivory/75" : "text-espresso-600")}>{plan.tagline}</p>
                  <p className="relative mt-6 flex items-baseline gap-1.5">
                    <span className={cn("font-display text-[52px] font-medium leading-none tracking-[-0.04em]", hl ? "text-ivory" : "text-espresso")}>
                      ${plan.priceMonthly}
                    </span>
                    <span className={cn("text-[14px]", hl ? "text-ivory/70" : "text-espresso-500")}>/ month</span>
                  </p>
                  <GlassButton asChild variant={hl ? "primary" : plan.priceMonthly === 0 ? "dark" : "glass"} pill className="relative mt-6 w-full">
                    <Link href={`/signup?plan=${id}`} aria-label={plan.priceMonthly === 0 ? "Start free" : `Choose the ${plan.name} plan`}>
                      {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
                      <ArrowRight aria-hidden />
                    </Link>
                  </GlassButton>
                  <ul className={cn("relative mt-7 space-y-3 border-t pt-6 text-[14.5px]", hl ? "border-white/10" : "border-espresso/[0.08]")}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full",
                            hl ? "bg-peach/20 text-peach" : "bg-mint-soft text-mint-ink",
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className={hl ? "text-ivory/90" : "text-espresso-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </ul>

        <p className="mx-auto mt-10 max-w-xl text-center text-[13.5px] leading-relaxed text-espresso-500">
          Prices shown are proposed and may change. Payments are processed securely by Stripe.
        </p>
      </div>
    </section>
  );
}
