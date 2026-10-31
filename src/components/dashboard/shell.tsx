"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronsUpDown,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Palette,
  Plus,
  QrCode,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { Activity, PlanId, Role, SessionUser, SubscriptionStatus } from "@/lib/domain";
import { cn, initials, relativeTime } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { GlassSidebar, GlassSidebarItem } from "@/components/glass/glass-sidebar";
import {
  GlassDropdown,
  GlassDropdownContent,
  GlassDropdownItem,
  GlassDropdownLabel,
  GlassDropdownSeparator,
  GlassDropdownTrigger,
} from "@/components/glass/glass-dropdown";
import { GlassButton } from "@/components/glass/glass-button";
import { Badge } from "@/components/glass/primitives";
import { switchRestaurantAction } from "@/app/actions/restaurant";
import { signOutAction } from "@/app/actions/auth";
import { SignOutButton } from "@clerk/nextjs";
import { CommandPalette } from "./command-palette";
import { useLocalStorage } from "@/lib/hooks";

interface ShellRestaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard /> },
  { href: "/dashboard/menus", label: "Menus", icon: <BookOpen /> },
  { href: "/dashboard/qr", label: "QR Codes", icon: <QrCode /> },
  { href: "/dashboard/orders", label: "Orders", icon: <ShoppingBag />, optional: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart3 /> },
  { href: "/dashboard/customers", label: "Customers", icon: <Users />, optional: true },
  { href: "/dashboard/branding", label: "Branding", icon: <Palette /> },
  { href: "/dashboard/billing", label: "Billing", icon: <CreditCard /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings /> },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
}

function RestaurantAvatar({ r, size = 32 }: { r: ShellRestaurant; size?: number }) {
  return r.logoUrl ? (
    <span className="relative shrink-0 overflow-hidden rounded-[10px] ring-1 ring-espresso/10" style={{ width: size, height: size }}>
      <Image src={r.logoUrl} alt="" fill sizes={`${size}px`} unoptimized={r.logoUrl.startsWith("/api/uploads/")} className="object-cover" />
    </span>
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(150deg,#B9A7F8,#8570E6)] text-[13px] font-semibold text-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(r.name)}
    </span>
  );
}

export function DashboardShell({
  user,
  restaurant,
  restaurants,
  plan,
  subscriptionStatus,
  subscriptionSource,
  role,
  activity,
  demoMode,
  children,
}: {
  user: SessionUser;
  restaurant: ShellRestaurant;
  restaurants: (ShellRestaurant & { role: Role })[];
  plan: { id: PlanId; name: string };
  subscriptionStatus: SubscriptionStatus;
  subscriptionSource: string;
  role: Role;
  activity: Activity[];
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const editorRoute = /^\/dashboard\/menus\/[^/]+$/.test(pathname);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const switchTo = async (id: string) => {
    if (id === restaurant.id) return;
    const res = await switchRestaurantAction(id);
    if (!res.ok) toast.error(res.error);
    else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <Logo href="/dashboard" />
        {onNavigate && (
          <button type="button" onClick={onNavigate} aria-label="Close navigation" className="grid size-9 place-items-center rounded-xl text-espresso-500 hover:bg-espresso/5">
            <X className="size-5" />
          </button>
        )}
      </div>
      <div className="px-3 pt-3">
        <GlassDropdown>
          <GlassDropdownTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-[16px] border border-white/70 bg-white/60 p-2 text-left shadow-[var(--shadow-soft)] transition hover:bg-white/90"
              aria-label={`Current restaurant: ${restaurant.name}. Switch restaurant`}
            >
              <RestaurantAvatar r={restaurant} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-espresso">{restaurant.name}</span>
                <span className="block truncate text-[12px] capitalize text-espresso-500">{role}</span>
              </span>
              <ChevronsUpDown className="size-4 text-espresso-400" aria-hidden />
            </button>
          </GlassDropdownTrigger>
          <GlassDropdownContent align="start" className="w-[248px]">
            <GlassDropdownLabel>Restaurants</GlassDropdownLabel>
            {restaurants.map((r) => (
              <GlassDropdownItem key={r.id} onSelect={() => void switchTo(r.id)}>
                <RestaurantAvatar r={r} size={24} />
                <span className="flex-1 truncate">{r.name}</span>
                {r.id === restaurant.id && <Check className="size-4 text-terracotta" />}
              </GlassDropdownItem>
            ))}
            <GlassDropdownSeparator />
            <GlassDropdownItem asChild>
              <Link href="/onboarding/new">
                <Plus /> Add restaurant
              </Link>
            </GlassDropdownItem>
          </GlassDropdownContent>
        </GlassDropdown>
      </div>
      <nav aria-label="Dashboard" className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((item) => (
          <GlassSidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(pathname, item.href)}
            layoutId={onNavigate ? "sidebar-active-mobile" : "sidebar-active"}
            onNavigate={onNavigate}
            badge={item.optional ? <Badge className="h-5 px-2 text-[10.5px]">Optional</Badge> : undefined}
          />
        ))}
      </nav>
      <div className="p-3">
        <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(150deg,#2E231E,#241B18)] p-4 text-ivory">
          <div aria-hidden className="absolute -right-6 -top-8 size-24 rounded-full bg-terracotta/40 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory/70">Plan</span>
            <Badge tone={plan.id === "free" ? "neutral" : "mint"} className={plan.id === "free" ? "bg-white/10 text-ivory" : ""}>
              {plan.name}
            </Badge>
          </div>
          <p className="relative mt-2 text-[13px] leading-snug text-ivory/80">
            {subscriptionSource === "demo"
              ? "Demo plan — no payment involved."
              : subscriptionStatus === "past_due"
                ? "Payment issue — update your card."
                : plan.id === "free"
                  ? "Unlock templates, styled QR codes and analytics."
                  : "Thanks for supporting MenuMint."}
          </p>
          <GlassButton asChild size="sm" variant={plan.id === "free" ? "primary" : "glass"} className="relative mt-3 w-full" onClick={onNavigate}>
            <Link href="/dashboard/billing">{plan.id === "free" ? <><Sparkles /> Upgrade</> : "Manage plan"}</Link>
          </GlassButton>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-dvh bg-[radial-gradient(1200px_600px_at_0%_-10%,#FFE3D2_0%,transparent_60%),radial-gradient(900px_500px_at_100%_0%,#EDE6FF_0%,transparent_55%),#FFF9F2]">
      {demoMode && (
        <div className="relative z-40 flex items-center justify-center gap-2 bg-espresso px-4 py-1.5 text-center text-[12.5px] text-ivory/90">
          <Sparkles className="size-3.5 text-champagne" aria-hidden />
          <span>
            <strong className="font-semibold text-ivory">Demo mode</strong> — Supabase isn&apos;t configured, so data is saved locally on this server.
          </span>
        </div>
      )}
      <div className="mx-auto flex max-w-[1600px] gap-5 p-3 sm:p-4">
        <GlassSidebar
          className={cn("sticky top-4 hidden w-[264px] shrink-0 lg:flex", demoMode ? "h-[calc(100dvh-2rem-31px)]" : "h-[calc(100dvh-2rem)]")}
          label="Dashboard"
        >
          {sidebarContent()}
        </GlassSidebar>

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-espresso/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="absolute inset-y-2 left-2 flex w-[min(300px,calc(100vw-1rem))]"
                initial={{ x: "-110%" }}
                animate={{ x: 0 }}
                exit={{ x: "-110%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <GlassSidebar className="glass-strong w-full" label="Mobile">
                  {sidebarContent(() => setMobileOpen(false))}
                </GlassSidebar>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <header className="glass sticky top-3 z-30 mb-5 flex h-16 items-center gap-2 rounded-[22px] px-3 sm:top-4 sm:px-4">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-espresso-600 hover:bg-espresso/5 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[14px] border border-espresso/[0.08] bg-white/60 px-3 text-left text-sm text-espresso-500 transition hover:bg-white/90 sm:max-w-md"
              aria-label="Search menus, dishes and pages"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Search menus, dishes, pages…</span>
              <kbd className="ml-auto hidden rounded-md border border-espresso/10 bg-white px-1.5 py-0.5 font-sans text-[11px] text-espresso-500 sm:block">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <GlassButton asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <a href={`/m/${restaurant.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View menu
                </a>
              </GlassButton>
              <NotificationsMenu activity={activity} restaurantId={restaurant.id} />
              <GlassDropdown>
                <GlassDropdownTrigger asChild>
                  <button type="button" aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-terracotta/60">
                    <span className="grid size-10 place-items-center rounded-full bg-[linear-gradient(150deg,#FFC6A6,#E97542)] text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgb(233_117_66/0.6)] ring-2 ring-white">
                      {initials(user.fullName || user.email)}
                    </span>
                  </button>
                </GlassDropdownTrigger>
                <GlassDropdownContent className="w-60">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-espresso">{user.fullName}</p>
                    <p className="truncate text-xs text-espresso-500">{user.email}</p>
                  </div>
                  <GlassDropdownSeparator />
                  <GlassDropdownItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings /> Settings
                    </Link>
                  </GlassDropdownItem>
                  <GlassDropdownItem asChild>
                    <Link href="/dashboard/billing">
                      <CreditCard /> Billing
                    </Link>
                  </GlassDropdownItem>
                  <GlassDropdownItem asChild>
                    <a href={`/m/${restaurant.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink /> Public menu
                    </a>
                  </GlassDropdownItem>
                  <GlassDropdownSeparator />
                  {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                     <SignOutButton redirectUrl="/login?signedOut=1">
                       <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger">
                         <LogOut className="size-4" /> Log out
                       </button>
                     </SignOutButton>
                   ) : (
                     <GlassDropdownItem destructive onSelect={() => void signOutAction()}>
                    <LogOut /> Log out
                  </GlassDropdownItem>
                  )}
                </GlassDropdownContent>
              </GlassDropdown>
            </div>
          </header>
          <main id="main" className={cn("min-w-0", editorRoute ? "" : "pb-10")}>
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} nav={NAV} restaurantSlug={restaurant.slug} />
    </div>
  );
}

function NotificationsMenu({ activity, restaurantId }: { activity: Activity[]; restaurantId: string }) {
  const [seen, setSeen] = useLocalStorage(`mm-notif-seen-${restaurantId}`);
  const unread = seen === null ? 0 : activity.filter((a) => a.createdAt > seen).length;
  return (
    <GlassDropdown
      onOpenChange={(open) => {
        if (open && activity[0]) {
          const latest = activity[0].createdAt;
          setTimeout(() => setSeen(latest), 1200);
        }
      }}
    >
      <GlassDropdownTrigger asChild>
        <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-10 place-items-center rounded-xl text-espresso-600 transition hover:bg-espresso/5">
          <Bell className="size-[19px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-[17px] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold leading-[17px] text-white ring-2 ring-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </GlassDropdownTrigger>
      <GlassDropdownContent className="w-[340px] p-2">
        <GlassDropdownLabel>Recent activity</GlassDropdownLabel>
        {activity.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-espresso-500">Nothing yet — publish a menu to get started.</p>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-espresso/[0.04]">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", seen !== null && a.createdAt > seen ? "bg-terracotta" : "bg-espresso/15")} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm text-espresso">{a.message}</p>
                  <p className="text-xs text-espresso-500">{relativeTime(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassDropdownContent>
    </GlassDropdown>
  );
}
