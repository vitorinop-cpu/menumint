import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Eye, LayoutList, Palette, Plus, QrCode, ScanLine, Sparkles, UtensilsCrossed } from "lucide-react";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { getAnalyticsSummary } from "@/lib/services/analytics";
import { getTemplate, FONT_OPTIONS } from "@/lib/templates";
import { compactNumber, relativeTime } from "@/lib/utils";
import { GlassCard, GlassCardHeader } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { Badge } from "@/components/glass/primitives";
import { GlassNotification } from "@/components/glass/glass-notification";
import { PageHeader, StatCard, EmptyState, pctDelta } from "@/components/dashboard/page-header";
import { TrafficChart } from "@/components/dashboard/charts";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { MenuView } from "@/components/public-menu/menu-view";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage(props: PageProps<"/dashboard">) {
  const sp = await props.searchParams;
  const { restaurant, user, plan } = await getRestaurantContext();
  const repo = await getRepo();
  const [menus, qrCodes, branding, activity, summary] = await Promise.all([
    repo.listMenus(restaurant.id),
    repo.listQrCodes(restaurant.id),
    repo.getBranding(restaurant.id),
    repo.listActivity(restaurant.id, 6),
    getAnalyticsSummary(restaurant.id, 14),
  ]);
  const activeMenus = menus.filter((m) => !m.archived);
  const published = activeMenus.filter((m) => m.status === "published");
  const totalItems = activeMenus.reduce((s, m) => s + m.itemCount, 0);
  const previewMenu = published[0] ?? activeMenus[0];
  const previewTree = previewMenu ? await repo.getMenuTree(previewMenu.id) : null;
  const template = branding ? getTemplate(branding.template) : null;
  const firstName = user.fullName.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const brandingInput = branding ? (({ restaurantId: _r, updatedAt: _u, ...b }) => b)(branding) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={restaurant.name}
        title={`${greeting}, ${firstName}.`}
        description="Here's how your menus are performing over the last 14 days."
        actions={
          <>
            <GlassButton asChild variant="glass">
              <Link href="/dashboard/qr">
                <QrCode /> QR codes
              </Link>
            </GlassButton>
            <GlassButton asChild>
              <Link href="/dashboard/menus?new=1">
                <Plus /> New menu
              </Link>
            </GlassButton>
          </>
        }
      />

      {sp.welcome && (
        <GlassNotification tone="success" title="Welcome to your dashboard!">
          Your restaurant is set up. Open the menu editor to add photos, allergens and more dishes.
        </GlassNotification>
      )}
      {sp.passwordUpdated && <GlassNotification tone="success" title="Your password was updated." />}
      {summary.hasDemoData && (
        <GlassNotification tone="demo" title="Showing labeled sample analytics">
          This demo restaurant includes generated sample traffic so you can explore the dashboard. Real scans and views are added on top as they happen.
        </GlassNotification>
      )}

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menu views" value={compactNumber(summary.totals.views)} delta={pctDelta(summary.totals.views, summary.previous.views)} hint="vs previous 14 days" icon={<Eye />} />
        <StatCard label="QR scans" value={compactNumber(summary.totals.scans)} delta={pctDelta(summary.totals.scans, summary.previous.scans)} hint="vs previous 14 days" icon={<ScanLine />} accent="lavender" />
        <StatCard label="Published menus" value={`${published.length}/${activeMenus.length}`} hint={`${plan.limits.menus >= 50 ? "Unlimited" : plan.limits.menus} on ${plan.name}`} icon={<BookOpen />} accent="mint" />
        <StatCard label="Menu items" value={totalItems} hint={`across ${activeMenus.length} menu${activeMenus.length === 1 ? "" : "s"}`} icon={<UtensilsCrossed />} accent="champagne" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <GlassCard>
            <GlassCardHeader
              title="Menu performance"
              description="Daily menu views and QR scans"
              action={
                <GlassButton asChild variant="ghost" size="sm">
                  <Link href="/dashboard/analytics">
                    Analytics <ArrowUpRight />
                  </Link>
                </GlassButton>
              }
            />
            {summary.isEmpty ? (
              <EmptyState
                icon={<ScanLine />}
                title="No traffic yet"
                description="Views and scans appear here as soon as guests open your published menu."
                action={
                  <GlassButton asChild size="sm" variant="glass">
                    <Link href="/dashboard/qr">Print your QR code</Link>
                  </GlassButton>
                }
              />
            ) : (
              <TrafficChart data={summary.series} />
            )}
          </GlassCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <GlassCard>
              <GlassCardHeader title="Most viewed dishes" description="Opened from the menu, last 14 days" />
              {summary.topItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-espresso-500">Dish views will appear once guests tap items on your menu.</p>
              ) : (
                <ol className="space-y-2">
                  {summary.topItems.slice(0, 5).map((it, i) => (
                    <li key={it.itemId} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-white/60">
                      <span className="w-4 text-center font-display text-lg text-espresso-400">{i + 1}</span>
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-peach-soft">
                        {it.imageUrl ? (
                          <Image src={it.imageUrl} alt="" fill sizes="40px" unoptimized={it.imageUrl.startsWith("/api/uploads/")} className="object-cover" />
                        ) : (
                          <UtensilsCrossed className="absolute inset-0 m-auto size-4 text-terracotta" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-espresso">{it.name}</span>
                        <span className="block truncate text-xs text-espresso-500">{it.menuName}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-espresso">{it.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </GlassCard>

            <GlassCard>
              <GlassCardHeader title="Recent activity" />
              {activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-espresso-500">Your team&apos;s changes will show up here.</p>
              ) : (
                <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-espresso/10">
                  {activity.map((a) => (
                    <li key={a.id} className="relative flex gap-3 pl-0">
                      <span className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-white bg-terracotta shadow" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm text-espresso">{a.message}</p>
                        <p className="text-xs text-espresso-500">{relativeTime(a.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <GlassCardHeader title="Quick actions" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: previewMenu ? `/dashboard/menus/${previewMenu.id}` : "/dashboard/menus", icon: <LayoutList />, label: "Edit menu", sub: previewMenu?.name ?? "Create one" },
                { href: "/dashboard/qr", icon: <QrCode />, label: "QR Studio", sub: `${qrCodes.length} code${qrCodes.length === 1 ? "" : "s"}` },
                { href: "/dashboard/branding", icon: <Palette />, label: "Branding", sub: template?.name ?? "Customise" },
                { href: `/m/${restaurant.slug}`, icon: <Eye />, label: "Public menu", sub: `/m/${restaurant.slug}`, external: true },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  target={a.external ? "_blank" : undefined}
                  className="group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-3 transition-all duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-peach-soft text-terracotta-ink transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110 [&_svg]:size-[18px]">{a.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-espresso">{a.label}</span>
                    <span className="block truncate text-xs text-espresso-500">{a.sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-5">
          {brandingInput && template && (
            <GlassCard>
              <GlassCardHeader
                title="Current branding"
                description={template.name}
                action={
                  <GlassButton asChild variant="ghost" size="sm">
                    <Link href="/dashboard/branding">Edit</Link>
                  </GlassButton>
                }
              />
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2" aria-label="Brand colours">
                  {[brandingInput.primaryColor, brandingInput.secondaryColor, brandingInput.backgroundColor].map((c) => (
                    <span key={c} title={c} className="size-9 rounded-full ring-[3px] ring-white" style={{ background: c }} />
                  ))}
                </div>
                <div className="min-w-0 text-xs text-espresso-500">
                  <p className="truncate">
                    <span className="font-semibold text-espresso">{FONT_OPTIONS.find((f) => f.id === brandingInput.headingFont)?.label}</span> /{" "}
                    {FONT_OPTIONS.find((f) => f.id === brandingInput.bodyFont)?.label}
                  </p>
                  <p className="capitalize">
                    {brandingInput.theme} · {brandingInput.itemLayout} layout
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
          <GlassCard>
            <GlassCardHeader
              title="Menu preview"
              description={previewMenu ? `${previewMenu.name} · ${previewMenu.status === "published" ? "live" : "draft"}` : "No menus yet"}
              action={previewMenu?.status === "published" ? <Badge tone="mint" dot>Live</Badge> : <Badge>Draft</Badge>}
            />
            {previewTree && brandingInput ? (
              <PhoneFrame className="max-w-[300px]">
                <MenuView mode="preview" restaurant={restaurant} branding={brandingInput} content={previewTree} showBadge={!plan.removeBadge} />
              </PhoneFrame>
            ) : (
              <EmptyState
                icon={<Sparkles />}
                title="Create your first menu"
                description="Your live preview will appear here."
                action={
                  <GlassButton asChild size="sm">
                    <Link href="/dashboard/menus?new=1">New menu</Link>
                  </GlassButton>
                }
              />
            )}
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
