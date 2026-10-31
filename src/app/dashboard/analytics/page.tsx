import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Eye, Lock, MousePointerClick, ScanLine, ShieldCheck, Smartphone, UtensilsCrossed } from "lucide-react";
import { getRestaurantContext } from "@/lib/services/context";
import { getAnalyticsSummary } from "@/lib/services/analytics";
import { compactNumber, cn } from "@/lib/utils";
import { PageHeader, StatCard, EmptyState, pctDelta } from "@/components/dashboard/page-header";
import { GlassCard, GlassCardHeader } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassNotification } from "@/components/glass/glass-notification";
import { PlanLock } from "@/components/glass/primitives";
import { TrafficChart, HorizontalBars, DonutChart, DEVICE_COLORS } from "@/components/dashboard/charts";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 90, 365] as const;

export default async function AnalyticsPage(props: PageProps<"/dashboard/analytics">) {
  const sp = await props.searchParams;
  const { restaurant, plan } = await getRestaurantContext();

  if (plan.analytics === "none") {
    return (
      <div>
        <PageHeader eyebrow="Analytics" title="Analytics" description="Understand how guests find and use your menu." />
        <GlassCard>
          <EmptyState
            icon={<Lock />}
            title="Analytics is available on Starter and above"
            description="See menu views, QR scans and traffic trends. Pro adds popular dishes, devices and per-code breakdowns."
            action={
              <GlassButton asChild variant="lavender">
                <Link href="/dashboard/billing">Compare plans</Link>
              </GlassButton>
            }
          />
        </GlassCard>
      </div>
    );
  }

  const maxDays = plan.limits.analyticsDays;
  const requested = Number(sp.range);
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? Math.min(requested, maxDays) : Math.min(30, maxDays);
  const s = await getAnalyticsSummary(restaurant.id, days);
  const detailed = plan.analytics === "detailed";
  const totalDevices = s.devices.reduce((a, d) => a + d.count, 0);
  const opensPerView = s.totals.views ? s.totals.itemViews / s.totals.views : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        description={`${restaurant.name} · ${new Date(s.range.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(s.range.to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
        actions={
          <nav aria-label="Date range" className="glass-subtle inline-flex gap-1 rounded-2xl p-1">
            {RANGES.map((r) => {
              const locked = r > maxDays;
              const active = r === days;
              return locked ? (
                <span key={r} className="flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-espresso-400" title={`Available on Pro`}>
                  {r === 365 ? "1y" : `${r}d`} <Lock className="size-3" aria-label="locked" />
                </span>
              ) : (
                <Link
                  key={r}
                  href={`/dashboard/analytics?range=${r}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center rounded-xl px-3.5 text-sm font-medium transition",
                    active ? "bg-white text-espresso shadow-[0_1px_2px_rgb(36_27_24/0.08),0_4px_12px_-4px_rgb(36_27_24/0.12)]" : "text-espresso-500 hover:text-espresso",
                  )}
                >
                  {r === 365 ? "1y" : `${r}d`}
                </Link>
              );
            })}
          </nav>
        }
      />

      {s.hasDemoData && (
        <GlassNotification tone="demo" title="Includes labeled sample data">
          This demo restaurant was seeded with generated traffic. Events flagged as demo are never mixed into real restaurants.
        </GlassNotification>
      )}

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menu views" value={compactNumber(s.totals.views)} delta={pctDelta(s.totals.views, s.previous.views)} hint={`vs prior ${days}d`} icon={<Eye />} />
        <StatCard label="QR scans" value={compactNumber(s.totals.scans)} delta={pctDelta(s.totals.scans, s.previous.scans)} hint={`vs prior ${days}d`} icon={<ScanLine />} accent="lavender" />
        <StatCard label="Dish opens" value={compactNumber(s.totals.itemViews)} delta={pctDelta(s.totals.itemViews, s.previous.itemViews)} hint={`vs prior ${days}d`} icon={<MousePointerClick />} accent="mint" />
        <StatCard label="Engagement" value={opensPerView.toFixed(2)} hint="avg. dish opens per menu view" icon={<BarChart3 />} accent="champagne" />
      </section>

      <GlassCard>
        <GlassCardHeader title="Traffic trend" description="Daily menu views and QR scans (UTC)" />
        {s.isEmpty ? (
          <EmptyState icon={<BarChart3 />} title="No data for this period" description="Publish a menu and share your QR code — traffic will appear here within seconds." />
        ) : (
          <TrafficChart data={s.series} height={300} />
        )}
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="relative">
          <GlassCardHeader title="Popular dishes" description="Most-opened items" action={!detailed && <PlanLock plan="Pro" />} />
          {!detailed ? (
            <LockedOverlay />
          ) : s.topItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-espresso-500">No dish opens yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {s.topItems.map((it, i) => {
                const max = s.topItems[0].views;
                return (
                  <li key={it.itemId} className="flex items-center gap-3">
                    <span className="w-5 text-right font-display text-lg text-espresso-400">{i + 1}</span>
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-peach-soft">
                      {it.imageUrl ? (
                        <Image src={it.imageUrl} alt="" fill sizes="40px" unoptimized={it.imageUrl.startsWith("/api/uploads/")} className="object-cover" />
                      ) : (
                        <UtensilsCrossed className="absolute inset-0 m-auto size-4 text-terracotta" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-espresso">{it.name}</span>
                        <span className="text-sm font-semibold tabular-nums text-espresso">{it.views}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-espresso/[0.06]">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#FFC6A6,#E97542)]" style={{ width: `${(it.views / max) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </GlassCard>

        <GlassCard>
          <GlassCardHeader title="Devices" description="Coarse device class only" action={!detailed && <PlanLock plan="Pro" />} />
          {!detailed ? (
            <LockedOverlay />
          ) : totalDevices === 0 ? (
            <p className="py-10 text-center text-sm text-espresso-500">No views yet.</p>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
              <DonutChart data={s.devices.map((d) => ({ name: d.device, value: d.count }))} label="Views by device type" />
              <ul className="space-y-2">
                {s.devices.map((d, i) => (
                  <li key={d.device} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                    <Smartphone className="size-4 text-espresso-400" aria-hidden />
                    <span className="flex-1 capitalize text-espresso">{d.device}</span>
                    <span className="font-semibold tabular-nums text-espresso">{Math.round((d.count / totalDevices) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <GlassCardHeader title="Scans by QR code" action={!detailed && <PlanLock plan="Pro" />} />
          {!detailed ? <LockedOverlay /> : s.qrCodes.length === 0 ? <p className="py-10 text-center text-sm text-espresso-500">No QR codes yet.</p> : <HorizontalBars data={s.qrCodes.map((q) => ({ name: q.name, value: q.scans }))} color="#8570E6" label="QR scans per code" />}
        </GlassCard>

        <GlassCard>
          <GlassCardHeader title="Views by menu" action={!detailed && <PlanLock plan="Pro" />} />
          {!detailed ? <LockedOverlay /> : s.menus.length === 0 ? <p className="py-10 text-center text-sm text-espresso-500">No menus yet.</p> : <HorizontalBars data={s.menus.map((m) => ({ name: m.name, value: m.views }))} label="Views per menu" />}
        </GlassCard>
      </div>

      <p className="flex items-center gap-2 px-1 text-[13px] text-espresso-500">
        <ShieldCheck className="size-4 text-mint-ink" aria-hidden />
        Privacy-first: no cookies for diners, no IP addresses or user agents stored, and Do Not Track is honoured.
      </p>
    </div>
  );
}

function LockedOverlay() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-lavender/50 bg-lavender-soft/30 px-6 py-10 text-center">
      <p className="text-sm font-medium text-espresso">Detailed analytics are part of Pro</p>
      <GlassButton asChild size="sm" variant="lavender" className="mt-3">
        <Link href="/dashboard/billing">Upgrade to Pro</Link>
      </GlassButton>
    </div>
  );
}
