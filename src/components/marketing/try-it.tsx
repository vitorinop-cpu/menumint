"use client";

import * as React from "react";
import Image from "next/image";
import { Check, LayoutGrid, LayoutList, Moon, Sun } from "lucide-react";
import { Segmented } from "@/components/glass/glass-tabs";
import { MenuView } from "@/components/public-menu/menu-view";
import type { BrandingInput, TemplateId } from "@/lib/domain";
import { SAMPLE_MENUS, sampleForTemplate } from "@/lib/sample-menu";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { cn, withAlpha } from "@/lib/utils";
import { PhoneMockup } from "./phone-mockup";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";
import { DEMO_SECTION_ID, PREVIEW_TEMPLATE_EVENT } from "./template-preview-button";

const SWATCHES = [
  { name: "Terracotta", hex: "#C8572B" },
  { name: "Bordeaux", hex: "#7A2E2E" },
  { name: "Saffron", hex: "#E8A33D" },
  { name: "Sage", hex: "#3F7D5C" },
  { name: "Harbour", hex: "#1F6F8B" },
];

/** Arrow-key navigation for custom radio groups (roving tabindex). */
function onRadioKeys<T>(e: React.KeyboardEvent, values: T[], current: T | null, set: (v: T) => void) {
  const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  const i = current === null ? -1 : values.indexOf(current);
  let next = i;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % values.length;
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + values.length) % values.length;
  if (e.key === "Home") next = 0;
  if (e.key === "End") next = values.length - 1;
  set(values[next]);
  const group = e.currentTarget as HTMLElement;
  requestAnimationFrame(() => group.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus());
}

function ControlLabel({ children, hint, id }: { children: React.ReactNode; hint?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <span id={id} className="text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso-600">
        {children}
      </span>
      {hint && <span className="text-[12.5px] text-espresso-500">{hint}</span>}
    </div>
  );
}

export function TryIt() {
  const [templateId, setTemplateId] = React.useState<TemplateId>("modern-bistro");
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [color, setColor] = React.useState<string | null>(null);
  const [layout, setLayout] = React.useState<"list" | "grid">("list");
  const [mounted, setMounted] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);

  const template = getTemplate(templateId);

  const selectTemplate = React.useCallback((id: TemplateId) => {
    const t = getTemplate(id);
    setTemplateId(id);
    setTheme(t.branding.theme);
    setLayout(t.branding.itemLayout);
    setColor(null);
  }, []);

  // Template gallery "Preview" buttons talk to this section through a window event.
  React.useEffect(() => {
    const onPreview = (e: Event) => {
      const id = (e as CustomEvent<TemplateId>).detail;
      if (TEMPLATES.some((t) => t.id === id)) {
        selectTemplate(id);
        setMounted(true);
      }
    };
    window.addEventListener(PREVIEW_TEMPLATE_EVENT, onPreview);
    return () => window.removeEventListener(PREVIEW_TEMPLATE_EVENT, onPreview);
  }, [selectTemplate]);

  // Only render the live menu once the section approaches the viewport.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || mounted) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setMounted(true), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const primary = color ?? template.branding.primaryColor;
  const branding = React.useMemo<BrandingInput>(
    () => ({
      ...template.branding,
      primaryColor: primary,
      theme,
      itemLayout: layout,
      showImages: layout === "grid" ? true : template.branding.showImages,
      backgroundColor: theme === "dark" ? "#141110" : template.branding.theme === "light" ? template.branding.backgroundColor : "#FFF9F2",
    }),
    [template, primary, theme, layout],
  );
  const sample = React.useMemo(() => sampleForTemplate(templateId), [templateId]);

  return (
    <section
      ref={sectionRef}
      id={DEMO_SECTION_ID}
      aria-labelledby={`${DEMO_SECTION_ID}-title`}
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(180deg,var(--color-ivory)_0%,var(--color-ivory-deep)_55%,var(--color-ivory)_100%)]" />
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-20">
        <div>
          <SectionHeading
            id={`${DEMO_SECTION_ID}-title`}
            eyebrow="Try it"
            title={
              <>
                Make it yours <Accent>in seconds.</Accent>
              </>
            }
            lede="Switch templates, flip to dark mode, try a brand colour. The phone on the right is the real MenuMint menu — tap any dish to see its allergens."
          />

          <Reveal delay={0.08} className="mt-10">
            <div className="glass-strong space-y-7 rounded-[28px] p-5 sm:p-7">
              <div>
                <ControlLabel id="demo-template-label" hint={template.description}>
                  Template
                </ControlLabel>
                <div
                  role="radiogroup"
                  aria-labelledby="demo-template-label"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  onKeyDown={(e) =>
                    onRadioKeys(
                      e,
                      TEMPLATES.map((t) => t.id),
                      templateId,
                      selectTemplate,
                    )
                  }
                >
                  {TEMPLATES.map((t) => {
                    const active = t.id === templateId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectTemplate(t.id)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-2xl p-1.5 pr-3 text-left transition-[background,box-shadow] duration-300",
                          active
                            ? "bg-white shadow-[0_1px_2px_rgb(36_27_24/0.08),0_8px_20px_-8px_rgb(36_27_24/0.18)] ring-2 ring-terracotta/70"
                            : "bg-espresso/[0.035] ring-1 ring-espresso/[0.06] hover:bg-white/80",
                        )}
                      >
                        <span className="relative h-10 w-12 shrink-0 overflow-hidden rounded-xl">
                          <Image src={t.cover} alt="" fill sizes="48px" className="object-cover" />
                        </span>
                        <span className="min-w-0 text-[13px] font-semibold leading-tight text-espresso">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <ControlLabel>Appearance</ControlLabel>
                  <Segmented
                    id="demo-theme"
                    label="Appearance"
                    value={theme}
                    onChange={setTheme}
                    options={[
                      {
                        value: "light",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <Sun className="size-3.5" aria-hidden /> Light
                          </span>
                        ),
                      },
                      {
                        value: "dark",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <Moon className="size-3.5" aria-hidden /> Dark
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
                <div>
                  <ControlLabel>Layout</ControlLabel>
                  <Segmented
                    id="demo-layout"
                    label="Item layout"
                    value={layout}
                    onChange={setLayout}
                    options={[
                      {
                        value: "list",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <LayoutList className="size-3.5" aria-hidden /> List
                          </span>
                        ),
                      },
                      {
                        value: "grid",
                        label: (
                          <span className="inline-flex items-center gap-1.5">
                            <LayoutGrid className="size-3.5" aria-hidden /> Grid
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>

              <div>
                <ControlLabel id="demo-color-label" hint={color ? SWATCHES.find((s) => s.hex === color)?.name : "Template colour"}>
                  Brand colour
                </ControlLabel>
                <div
                  role="radiogroup"
                  aria-labelledby="demo-color-label"
                  className="flex flex-wrap items-center gap-3"
                  onKeyDown={(e) =>
                    onRadioKeys(
                      e,
                      SWATCHES.map((s) => s.hex),
                      color,
                      setColor,
                    )
                  }
                >
                  {SWATCHES.map((s, i) => {
                    const active = s.hex === color;
                    return (
                      <button
                        key={s.hex}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={s.name}
                        tabIndex={active || (color === null && i === 0) ? 0 : -1}
                        onClick={() => setColor(s.hex)}
                        className={cn(
                          "grid size-10 place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-110",
                          active && "scale-110",
                        )}
                        style={{
                          background: `linear-gradient(160deg, ${s.hex}, ${s.hex})`,
                          boxShadow: active
                            ? `0 0 0 3px #fff, 0 0 0 5px ${s.hex}, 0 8px 18px -6px ${withAlpha(s.hex, 0.7)}`
                            : `inset 0 1px 0 rgb(255 255 255 / 0.35), 0 4px 10px -4px ${withAlpha(s.hex, 0.6)}`,
                        }}
                      >
                        {active && <Check className="size-4 text-white drop-shadow" strokeWidth={3} aria-hidden />}
                      </button>
                    );
                  })}
                  {color && (
                    <button
                      type="button"
                      onClick={() => setColor(null)}
                      className="ml-1 rounded-full px-2 py-1 text-[13px] font-medium text-terracotta-ink underline-offset-4 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="relative mx-auto">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] transition-[background] duration-700"
            style={{ background: `radial-gradient(closest-side, ${withAlpha(primary, 0.35)}, transparent)` }}
          />
          <PhoneMockup>
            {mounted ? (
              <MenuView
                key={templateId}
                mode="embed"
                restaurant={sample.restaurant}
                branding={branding}
                content={sample.content}
                menus={SAMPLE_MENUS}
                menuId={SAMPLE_MENUS[0].id}
                showBadge
              />
            ) : (
              <div className="h-full space-y-4 p-4 pt-14">
                <div className="skeleton h-40" />
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton h-20" />
                <div className="skeleton h-20" />
              </div>
            )}
          </PhoneMockup>
          <p className="mt-10 text-center text-[13px] text-espresso-500" aria-live="polite">
            {template.name} · {theme === "dark" ? "Dark" : "Light"} · {layout === "grid" ? "Grid" : "List"}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
