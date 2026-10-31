"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Phone, Search, Sparkles, X, Globe } from "lucide-react";
import type { BrandingInput, MenuContent, MenuItem, Restaurant } from "@/lib/domain";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/domain";
import { buildMenuTheme } from "@/lib/menu-theme";
import { cn, formatPrice } from "@/lib/utils";

export type MenuViewRestaurant = Pick<
  Restaurant,
  "id" | "name" | "tagline" | "logoUrl" | "coverUrl" | "address" | "phone" | "website" | "slug"
>;

export interface MenuViewProps {
  restaurant: MenuViewRestaurant;
  branding: BrandingInput;
  content: MenuContent;
  /** public = real customer page (tracks events); preview/embed render inside a frame. */
  mode: "public" | "preview" | "embed";
  menuId?: string;
  menus?: { id: string; name: string; slug: string }[];
  showBadge?: boolean;
  className?: string;
}

const dietaryLabel = (id: string) => DIETARY_TAGS.find((d) => d.id === id);
const allergenLabel = (id: string) => ALLERGENS.find((a) => a.id === id)?.label ?? id;

function track(payload: Record<string, unknown>) {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must never break the menu.
  }
}

function MenuImage({ src, alt, sizes, className, priority }: { src: string; alt: string; sizes: string; className?: string; priority?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.startsWith("/api/uploads/")}
      className={cn("object-cover", className)}
    />
  );
}

export function MenuView({ restaurant, branding, content, mode, menuId, menus, showBadge = true, className }: MenuViewProps) {
  const theme = React.useMemo(() => buildMenuTheme(branding), [branding]);
  const framed = mode !== "public";
  // Embedded previews live inside other pages: avoid a second <h1>/<main> landmark.
  const NameTag = framed ? "p" : "h1";
  const MainTag = framed ? "div" : "main";
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<string | null>(null);
  const [openItem, setOpenItem] = React.useState<MenuItem | null>(null);
  const sectionRefs = React.useRef(new Map<string, HTMLElement>());
  const searchId = React.useId();
  const uid = searchId.replace(/:/g, "");

  const categories = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return content.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => !i.archived && (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
        ),
      }))
      .filter((c) => c.items.length > 0 || (!q && framed));
  }, [content.categories, query, framed]);

  // Record a privacy-friendly page view once per load (public pages only).
  React.useEffect(() => {
    if (mode !== "public" || !menuId) return;
    track({ type: "menu_view", restaurantId: restaurant.id, menuId, referrer: document.referrer || null });
  }, [mode, menuId, restaurant.id]);

  // Scroll-spy for the category navigation.
  React.useEffect(() => {
    const root = framed ? scrollRef.current : null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCat(visible[0].target.getAttribute("data-cat"));
      },
      { root, rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories, framed]);

  const openDetails = (item: MenuItem) => {
    setOpenItem(item);
    if (mode === "public" && menuId) track({ type: "item_view", restaurantId: restaurant.id, menuId, itemId: item.id });
  };

  const jumpTo = (id: string) => {
    const el = sectionRefs.current.get(id);
    if (!el) return;
    setActiveCat(id);
    const container = framed ? scrollRef.current : null;
    const offset = 112;
    if (container) {
      container.scrollTo({ top: el.offsetTop - offset + 8, behavior: "smooth" });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    }
  };

  const currency = content.currency;
  const b = branding;
  const cardBase =
    b.cardStyle === "elevated"
      ? "bg-[var(--mm-surface)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.18)]"
      : b.cardStyle === "outlined"
        ? "border border-[var(--mm-border)] bg-[var(--mm-surface)]/40"
        : b.cardStyle === "flat"
          ? "bg-[var(--mm-surface)]"
          : "";

  const header = (
    <header className="relative">
      {b.headerStyle === "cover" && (
        <div className="relative h-[210px] w-full overflow-hidden sm:h-[280px]">
          {restaurant.coverUrl ? (
            <MenuImage src={restaurant.coverUrl} alt="" sizes="(max-width: 768px) 100vw, 768px" priority={mode === "public"} />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--mm-primary), var(--mm-secondary))` }} />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05)_0%,rgb(0_0_0/0.15)_45%,var(--mm-bg)_100%)]" />
        </div>
      )}
      <div
        className={cn(
          "relative px-5",
          b.headerStyle === "cover" ? "-mt-16" : "pt-10",
          b.headerStyle === "centered" ? "text-center" : "",
        )}
      >
        {b.headerStyle === "centered" && (
          <div aria-hidden className="mx-auto mb-5 flex items-center justify-center gap-3 text-[var(--mm-accent-ink)]">
            <span className="h-px w-10 bg-current opacity-50" />
            <Sparkles className="size-3.5" />
            <span className="h-px w-10 bg-current opacity-50" />
          </div>
        )}
        <div className={cn("flex items-end gap-4", b.headerStyle === "centered" && "flex-col items-center")}>
          {restaurant.logoUrl ? (
            <div
              className={cn(
                "relative shrink-0 overflow-hidden bg-[var(--mm-surface)] shadow-[0_6px_20px_-6px_rgb(0_0_0/0.3)] ring-4 ring-[var(--mm-bg)]",
                b.headerStyle === "minimal" ? "size-14" : "size-20",
              )}
              style={{ borderRadius: b.buttonStyle === "square" ? "10px" : "999px" }}
            >
              <MenuImage src={restaurant.logoUrl} alt={`${restaurant.name} logo`} sizes="80px" />
            </div>
          ) : b.headerStyle === "cover" ? (
            <div
              className="grid size-20 shrink-0 place-items-center text-2xl font-semibold shadow-[0_6px_20px_-6px_rgb(0_0_0/0.3)] ring-4 ring-[var(--mm-bg)]"
              style={{
                borderRadius: b.buttonStyle === "square" ? "10px" : "999px",
                background: "var(--mm-primary)",
                color: "var(--mm-on-primary)",
                fontFamily: "var(--mm-heading)",
              }}
              aria-hidden
            >
              {restaurant.name.slice(0, 1)}
            </div>
          ) : null}
          <div className="min-w-0 pb-1">
            <NameTag
              className={cn("leading-[1.05] tracking-[-0.02em] text-[var(--mm-text)]", b.headerStyle === "minimal" ? "text-[28px]" : "text-[34px]")}
              style={{ fontFamily: "var(--mm-heading)", fontWeight: b.headingFont === "archivo-black" ? 400 : 600 }}
            >
              {restaurant.name}
            </NameTag>
            {restaurant.tagline && <p className="mt-1.5 text-[15px] text-[var(--mm-muted)]">{restaurant.tagline}</p>}
          </div>
        </div>
      </div>
    </header>
  );

  const nav = (
    <div className="sticky top-0 z-20 backdrop-blur-xl">
      <div className="bg-[color-mix(in_srgb,var(--mm-bg)_86%,transparent)] px-5 pb-2 pt-3">
        {menus && menus.length > 1 && (
          <nav aria-label="Menus" className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
            {menus.map((m) => {
              const active = m.id === menuId;
              const cls = cn(
                "shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                active ? "bg-[var(--mm-text)] text-[var(--mm-bg)]" : "border border-[var(--mm-border)] text-[var(--mm-muted)] hover:text-[var(--mm-text)]",
              );
              return mode === "public" ? (
                <Link key={m.id} href={`/m/${restaurant.slug}/${m.slug}`} className={cls} style={{ borderRadius: "var(--mm-btn-radius)" }} aria-current={active ? "page" : undefined}>
                  {m.name}
                </Link>
              ) : (
                <span key={m.id} className={cls} style={{ borderRadius: "var(--mm-btn-radius)" }}>
                  {m.name}
                </span>
              );
            })}
          </nav>
        )}
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search the menu
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mm-muted)]" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes, drinks…"
            className="h-10 w-full border border-[var(--mm-border)] bg-[var(--mm-surface)] pl-10 pr-3 text-[15px] text-[var(--mm-text)] outline-none placeholder:text-[var(--mm-muted)] focus:border-[var(--mm-accent-ink)]"
            style={{ borderRadius: "var(--mm-btn-radius)" }}
          />
        </div>
        {categories.length > 0 && !query && (
          <nav aria-label="Categories" className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5">
            {categories.map((c) => {
              const active = activeCat === c.id;
              return b.categoryNav === "pills" ? (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpTo(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "h-8 shrink-0 px-3.5 text-[13px] font-semibold transition-all duration-300",
                    active ? "bg-[var(--mm-primary)] text-[var(--mm-on-primary)] shadow-sm" : "bg-[var(--mm-soft)] text-[var(--mm-text)] hover:opacity-80",
                  )}
                  style={{ borderRadius: "var(--mm-btn-radius)" }}
                >
                  {c.name}
                </button>
              ) : (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpTo(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative h-9 shrink-0 px-2.5 text-[14px] font-medium tracking-wide transition-colors",
                    active ? "text-[var(--mm-text)]" : "text-[var(--mm-muted)] hover:text-[var(--mm-text)]",
                  )}
                >
                  {c.name}
                  <span
                    aria-hidden
                    className={cn("absolute inset-x-2 bottom-0.5 h-[2px] origin-left bg-[var(--mm-accent-ink)] transition-transform duration-300", active ? "scale-x-100" : "scale-x-0")}
                  />
                </button>
              );
            })}
          </nav>
        )}
      </div>
      <div className="h-px bg-[var(--mm-border)]" />
    </div>
  );

  const renderItem = (item: MenuItem, index: number) => {
    const hasImage = b.showImages && Boolean(item.imageUrl);
    const price = formatPrice(item.price, currency);
    const tags = item.dietary.map(dietaryLabel).filter(Boolean);
    const soldOut = !item.available;
    const common = cn(
      "group relative w-full text-left transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mm-accent-ink)]",
      soldOut && "opacity-60",
    );
    const featured = item.featured && !soldOut && (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ background: "var(--mm-secondary)", color: "#1E1714", borderRadius: "var(--mm-btn-radius)" }}
      >
        <Sparkles aria-hidden className="size-3" /> Chef&apos;s pick
      </span>
    );
    const soldOutBadge = soldOut && (
      <span className="inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--mm-text)] ring-1 ring-[var(--mm-border)]" style={{ borderRadius: "var(--mm-btn-radius)" }}>
        Sold out
      </span>
    );
    const tagRow = tags.length > 0 && (
      <ul className="mt-2 flex flex-wrap gap-1" aria-label="Dietary information">
        {tags.map((t) => (
          <li key={t!.id} className="px-1.5 py-0.5 text-[11px] font-semibold text-[var(--mm-accent-ink)] ring-1 ring-[var(--mm-border)]" style={{ borderRadius: "6px" }}>
            {t!.label}
          </li>
        ))}
      </ul>
    );

    if (b.itemLayout === "grid") {
      return (
        <li key={item.id}>
          <button type="button" onClick={() => openDetails(item)} className={cn(common, "flex h-full flex-col overflow-hidden", cardBase)} style={{ borderRadius: "var(--mm-radius)" }}>
            {hasImage && (
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <MenuImage src={item.imageUrl!} alt={item.name} sizes="(max-width: 640px) 50vw, 300px" className="transition-transform duration-700 group-hover:scale-105" />
                {item.featured && !soldOut && <div className="absolute left-2 top-2">{featured}</div>}
              </div>
            )}
            <div className={cn("flex flex-1 flex-col", b.cardStyle === "minimal" ? "pt-3" : "p-3.5")}>
              {!hasImage && featured && <div className="mb-1.5">{featured}</div>}
              <h3 className="text-[15px] font-semibold leading-snug text-[var(--mm-text)]" style={{ fontFamily: "var(--mm-heading)", fontWeight: b.headingFont === "archivo-black" ? 400 : 600 }}>
                {item.name}
              </h3>
              {item.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--mm-muted)]">{item.description}</p>}
              <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                <span className="text-[15px] font-bold text-[var(--mm-accent-ink)]">{price}</span>
                {soldOutBadge}
              </div>
            </div>
          </button>
        </li>
      );
    }

    return (
      <li key={item.id} className={cn(b.cardStyle === "minimal" && index > 0 && "border-t border-[var(--mm-border)]")}>
        <button
          type="button"
          onClick={() => openDetails(item)}
          className={cn(common, "flex items-start gap-4", b.cardStyle === "minimal" ? "py-4" : cn("p-3.5", cardBase))}
          style={b.cardStyle === "minimal" ? undefined : { borderRadius: "var(--mm-radius)" }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">{featured}{soldOutBadge}</div>
            <div className={cn("flex items-baseline gap-2", (featured || soldOutBadge) && "mt-1.5")}>
              <h3 className="text-[16px] font-semibold leading-snug text-[var(--mm-text)]" style={{ fontFamily: "var(--mm-heading)", fontWeight: b.headingFont === "archivo-black" ? 400 : 600 }}>
                {item.name}
              </h3>
              {b.cardStyle === "minimal" && !hasImage && (
                <>
                  <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-[var(--mm-muted)] opacity-50" />
                  <span className="text-[15px] font-semibold text-[var(--mm-accent-ink)]">{price}</span>
                </>
              )}
            </div>
            {item.description && <p className="mt-1 text-[14px] leading-relaxed text-[var(--mm-muted)]">{item.description}</p>}
            {tagRow}
            {!(b.cardStyle === "minimal" && !hasImage) && <p className="mt-2 text-[15px] font-bold text-[var(--mm-accent-ink)]">{price}</p>}
          </div>
          {hasImage && (
            <div className="relative size-[92px] shrink-0 overflow-hidden" style={{ borderRadius: `calc(var(--mm-radius) * 0.75)` }}>
              <MenuImage src={item.imageUrl!} alt={item.name} sizes="92px" className="transition-transform duration-700 group-hover:scale-105" />
            </div>
          )}
        </button>
      </li>
    );
  };

  const body = (
    <>
      {header}
      {nav}
      <MainTag id={mode === "public" ? "main" : undefined} className="px-5 pb-10 pt-6">
        {content.description && !query && <p className="mb-6 text-[14px] italic text-[var(--mm-muted)]">{content.description}</p>}
        {categories.length === 0 && (
          <div className="py-16 text-center text-[var(--mm-muted)]">
            {query ? (
              <p>
                No dishes match “{query}”.{" "}
                <button type="button" className="font-semibold text-[var(--mm-accent-ink)] underline" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </p>
            ) : (
              <p>This menu doesn&apos;t have any items yet.</p>
            )}
          </div>
        )}
        <div className="space-y-9">
          {categories.map((c) => (
            <section
              key={c.id}
              data-cat={c.id}
              aria-labelledby={`${uid}-cat-${c.id}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(c.id, el);
                else sectionRefs.current.delete(c.id);
              }}
              className="scroll-mt-32"
            >
              <div className={cn("mb-3.5", b.headerStyle === "centered" && "text-center")}>
                <h2
                  id={`${uid}-cat-${c.id}`}
                  className={cn("text-[22px] leading-tight tracking-[-0.01em] text-[var(--mm-text)]", b.headingFont === "archivo-black" && "uppercase")}
                  style={{ fontFamily: "var(--mm-heading)", fontWeight: b.headingFont === "archivo-black" ? 400 : 600 }}
                >
                  {c.name}
                </h2>
                {c.description && <p className="mt-1 text-[14px] text-[var(--mm-muted)]">{c.description}</p>}
              </div>
              {c.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--mm-border)] px-4 py-6 text-center text-[13px] text-[var(--mm-muted)]">
                  No items in this category yet
                </p>
              ) : (
                <ul className={cn(b.itemLayout === "grid" ? "grid grid-cols-2 gap-3" : b.cardStyle === "minimal" ? "" : "space-y-3")}>
                  {c.items.map(renderItem)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </MainTag>
      <footer className="border-t border-[var(--mm-border)] px-5 pb-10 pt-6 text-[13px] text-[var(--mm-muted)]">
        <div className="space-y-2">
          {restaurant.address && (
            <p className="flex items-center gap-2">
              <MapPin aria-hidden className="size-4 shrink-0" /> {restaurant.address}
            </p>
          )}
          {restaurant.phone && (
            <p className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 shrink-0" />
              {mode === "public" ? <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-2 hover:underline">{restaurant.phone}</a> : restaurant.phone}
            </p>
          )}
          {restaurant.website && mode === "public" && (
            <p className="flex items-center gap-2">
              <Globe aria-hidden className="size-4 shrink-0" />
              <a href={restaurant.website} rel="noopener noreferrer" target="_blank" className="underline-offset-2 hover:underline">
                {restaurant.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
          <p className="pt-2 text-[12px]">Tap any dish for allergen details. Please tell our team about allergies before ordering.</p>
        </div>
        {showBadge && (
          <p className="mt-6 text-center text-[12px]">
            {mode === "public" ? (
              <Link href="/" className="font-medium opacity-80 hover:opacity-100">
                Menu by <span className="font-semibold">MenuMint</span>
              </Link>
            ) : (
              <span className="font-medium opacity-80">
                Menu by <span className="font-semibold">MenuMint</span>
              </span>
            )}
          </p>
        )}
      </footer>
    </>
  );

  return (
    <div
      className={cn("relative isolate", framed ? "h-full overflow-hidden" : "min-h-dvh", className)}
      style={{ ...theme.vars, background: "var(--mm-background)", color: "var(--mm-text)", fontFamily: "var(--mm-body)" } as React.CSSProperties}
      data-theme={theme.isDark ? "dark" : "light"}
    >
      {b.background === "paper" && <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 -z-10 opacity-90" />}
      {framed ? (
        <div ref={scrollRef} className="no-scrollbar relative h-full overflow-y-auto overscroll-contain">
          {body}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">{body}</div>
      )}
      <ItemSheet titleId={`${uid}-sheet-title`} item={openItem} currency={currency} onClose={() => setOpenItem(null)} contained={framed} showImages={b.showImages} />
    </div>
  );
}

function ItemSheet({
  titleId,
  item,
  currency,
  onClose,
  contained,
  showImages,
}: {
  titleId: string;
  item: MenuItem | null;
  currency: string;
  onClose: () => void;
  contained: boolean;
  showImages: boolean;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!item) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <div className={cn("z-50", contained ? "absolute inset-0" : "fixed inset-0")}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn("absolute inset-x-0 bottom-0 mx-auto max-h-[88%] max-w-xl overflow-y-auto bg-[var(--mm-bg)] text-[var(--mm-text)] shadow-2xl", "rounded-t-[28px]")}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {showImages && item.imageUrl && (
              <div className="relative aspect-[16/11] w-full">
                <MenuImage src={item.imageUrl} alt={item.name} sizes="(max-width: 640px) 100vw, 576px" />
              </div>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
            >
              <X className="size-[18px]" />
            </button>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 id={titleId} className="text-[24px] font-semibold leading-tight" style={{ fontFamily: "var(--mm-heading)" }}>
                  {item.name}
                </h2>
                <span className="pt-1 text-[18px] font-bold text-[var(--mm-accent-ink)]">{formatPrice(item.price, currency)}</span>
              </div>
              {!item.available && <p className="mt-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--mm-muted)]">Sold out today</p>}
              {item.description && <p className="mt-3 text-[15px] leading-relaxed text-[var(--mm-muted)]">{item.description}</p>}
              {item.dietary.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--mm-muted)]">Dietary</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.dietary.map((d) => (
                      <li key={d} className="rounded-full bg-[var(--mm-soft)] px-3 py-1 text-[13px] font-semibold">
                        {dietaryLabel(d)?.label ?? d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-5">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--mm-muted)]">Allergens</h3>
                {item.allergens.length > 0 ? (
                  <p className="mt-2 text-[14px]">Contains: {item.allergens.map(allergenLabel).join(", ")}.</p>
                ) : (
                  <p className="mt-2 text-[14px] text-[var(--mm-muted)]">No major allergens listed. Ask our team if you have concerns.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
