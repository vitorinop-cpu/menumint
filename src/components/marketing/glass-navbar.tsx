"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GlassButton } from "@/components/glass/glass-button";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "templates", label: "Templates" },
  { id: "qr", label: "QR codes" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

export function GlassNavbar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const sheetId = React.useId();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // Mobile sheet: focus the first link, trap Tab, close on Escape / outside click / resize to desktop.
  React.useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const focusables = [buttonRef.current, ...sheet.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)")].filter(
        (el): el is HTMLElement => Boolean(el),
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!sheet?.contains(t) && !buttonRef.current?.contains(t)) close(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && close(false);

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  const onAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname !== "/") return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setOpen(false);
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="pointer-events-auto relative w-full max-w-[1120px]">
        <nav
          aria-label="Main"
          className={cn(
            "mx-auto flex items-center justify-between gap-3 rounded-full pl-4 pr-2 transition-[height,max-width,background,box-shadow] duration-500 ease-[var(--ease-out-soft)] sm:pl-5",
            scrolled ? "glass-strong h-[54px] max-w-[1040px]" : "glass glass-rim h-[62px] max-w-[1120px]",
          )}
        >
          <Logo className={cn("shrink-0 transition-transform duration-500", scrolled && "scale-[0.94]")} />

          <ul className="hidden items-center gap-0.5 whitespace-nowrap lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/#${l.id}`}
                  onClick={(e) => onAnchor(e, l.id)}
                  className="rounded-full px-3.5 py-2 text-[14px] font-medium text-espresso-600 transition-colors hover:bg-espresso/[0.05] hover:text-espresso"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <GlassButton asChild variant="ghost" size="sm" pill className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </GlassButton>
            <GlassButton asChild variant="primary" size="sm" pill className="hidden px-4 sm:inline-flex">
              <Link href="/signup">
                Get started <ArrowRight aria-hidden />
              </Link>
            </GlassButton>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={sheetId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full text-espresso transition-colors hover:bg-espresso/[0.06] lg:hidden"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={sheetRef}
              id={sheetId}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="glass-strong absolute inset-x-0 top-[calc(100%+10px)] origin-top rounded-[28px] p-3 lg:hidden"
            >
              <ul className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/#${l.id}`}
                      onClick={(e) => {
                        onAnchor(e, l.id);
                        setOpen(false);
                      }}
                      className="flex h-12 items-center rounded-2xl px-4 font-display text-[19px] font-medium tracking-[-0.02em] text-espresso transition-colors hover:bg-espresso/[0.05]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-espresso/[0.08] pt-3">
                <GlassButton asChild variant="outline" pill>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                </GlassButton>
                <GlassButton asChild variant="primary" pill>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
