"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, CornerDownLeft, ExternalLink, Loader2, QrCode, Search, UtensilsCrossed } from "lucide-react";
import { dashboardSearchAction, type SearchHit } from "@/app/actions/search";
import { cn } from "@/lib/utils";

interface NavEntry {
  href: string;
  label: string;
  icon: React.ReactNode;
}

type Entry = { id: string; title: string; subtitle?: string; href: string; icon: React.ReactNode; external?: boolean };

export function CommandPalette({
  open,
  onOpenChange,
  nav,
  restaurantSlug,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  nav: NavEntry[];
  restaurantSlug: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-espresso/20 backdrop-blur-[6px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="glass-strong fixed left-1/2 top-[12vh] z-50 w-[min(620px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[24px]"
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                <Dialog.Title className="sr-only">Search</Dialog.Title>
                <Dialog.Description className="sr-only">Search pages, menus, dishes and QR codes</Dialog.Description>
                <PaletteBody nav={nav} restaurantSlug={restaurantSlug} onClose={() => onOpenChange(false)} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function PaletteBody({ nav, restaurantSlug, onClose }: { nav: NavEntry[]; restaurantSlug: string; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<{ q: string; hits: SearchHit[] }>({ q: "", hits: [] });
  const [index, setIndex] = React.useState(0);
  const listId = React.useId();
  const trimmed = query.trim();
  const searching = trimmed.length >= 2;
  const loading = searching && result.q !== trimmed;
  const hits = searching && result.q === trimmed ? result.hits : [];

  React.useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const found = await dashboardSearchAction(trimmed).catch(() => []);
      if (!cancelled) setResult({ q: trimmed, hits: found });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);

  const q = query.trim().toLowerCase();
  const entries: Entry[] = [
    ...nav.filter((n) => !q || n.label.toLowerCase().includes(q)).map((n) => ({ id: n.href, title: n.label, subtitle: "Page", href: n.href, icon: n.icon })),
    ...(!q || "public menu view live".includes(q)
      ? [{ id: "public", title: "View public menu", subtitle: `/m/${restaurantSlug}`, href: `/m/${restaurantSlug}`, icon: <ExternalLink />, external: true }]
      : []),
    ...hits.map((h) => ({
      id: `${h.type}-${h.id}`,
      title: h.title,
      subtitle: h.subtitle,
      href: h.href,
      icon: h.type === "menu" ? <BookOpen /> : h.type === "qr" ? <QrCode /> : <UtensilsCrossed />,
    })),
  ];
  const safeIndex = Math.min(index, Math.max(0, entries.length - 1));

  const go = (e: Entry) => {
    onClose();
    if (e.external) window.open(e.href, "_blank", "noopener");
    else router.push(e.href);
  };

  return (
    <>
                <div className="flex items-center gap-3 border-b border-espresso/[0.07] px-5">
                  {loading ? <Loader2 className="size-5 animate-spin text-espresso-400" aria-hidden /> : <Search className="size-5 text-espresso-400" aria-hidden />}
                  <input
                    autoFocus
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listId}
                    aria-activedescendant={entries[safeIndex] ? `${listId}-${safeIndex}` : undefined}
                    aria-label="Search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setIndex((i) => Math.min(i + 1, entries.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter" && entries[safeIndex]) {
                        e.preventDefault();
                        go(entries[safeIndex]);
                      }
                    }}
                    placeholder="Search menus, dishes, QR codes, pages…"
                    className="h-14 flex-1 bg-transparent text-[16px] text-espresso outline-none placeholder:text-espresso-400"
                  />
                  <kbd className="rounded-md border border-espresso/10 bg-white px-1.5 py-0.5 text-[11px] text-espresso-500">Esc</kbd>
                </div>
                <ul id={listId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
                  {entries.length === 0 && !loading && <li className="px-3 py-8 text-center text-sm text-espresso-500">No results for “{query}”.</li>}
                  {entries.map((e, i) => (
                    <li
                      key={e.id}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === safeIndex}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => go(e)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        i === safeIndex ? "bg-espresso/[0.06]" : "",
                      )}
                    >
                      <span className="grid size-8 place-items-center rounded-lg bg-white text-espresso-500 shadow-[var(--shadow-soft)] [&_svg]:size-4">{e.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-espresso">{e.title}</span>
                        {e.subtitle && <span className="block truncate text-xs text-espresso-500">{e.subtitle}</span>}
                      </span>
                      {i === safeIndex && <CornerDownLeft className="size-4 text-espresso-400" aria-hidden />}
                    </li>
                  ))}
                </ul>
    </>
  );
}
