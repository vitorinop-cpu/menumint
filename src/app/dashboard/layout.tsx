import type { Metadata } from "next";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · MenuMint" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRestaurantContext();
  const repo = await getRepo();
  const activity = await repo.listActivity(ctx.restaurant.id, 12);
  return (
    <DashboardShell
      user={ctx.user}
      restaurant={{ id: ctx.restaurant.id, name: ctx.restaurant.name, slug: ctx.restaurant.slug, logoUrl: ctx.restaurant.logoUrl }}
      restaurants={ctx.restaurants.map((r) => ({ id: r.id, name: r.name, slug: r.slug, logoUrl: r.logoUrl, role: r.role }))}
      plan={{ id: ctx.plan.id, name: ctx.plan.name }}
      subscriptionStatus={ctx.subscription?.status ?? "none"}
      subscriptionSource={ctx.subscription?.source ?? "default"}
      role={ctx.role}
      activity={activity}
      demoMode={isDemoMode()}
    >
      {children}
    </DashboardShell>
  );
}
