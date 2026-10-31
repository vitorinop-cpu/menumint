"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Image as ImageIcon, LayoutTemplate, Palette, RotateCcw, Save, SlidersHorizontal, Type } from "lucide-react";
import type { BrandingInput, MenuContent, Restaurant, TemplateId } from "@/lib/domain";
import { BRANDING_FIELDS, minimumPlanForTemplate, PLANS, type BrandingLevel } from "@/lib/plans";
import { FONT_OPTIONS, TEMPLATES, fontFamily, getTemplate } from "@/lib/templates";
import { buildMenuTheme } from "@/lib/menu-theme";
import { cn, contrastRatio } from "@/lib/utils";
import { saveBrandingAction } from "@/app/actions/branding";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassTabs } from "@/components/glass/glass-tabs";
import { Segmented } from "@/components/glass/glass-tabs";
import { ColorField, GlassSwitch, PlanLock } from "@/components/glass/primitives";
import { GlassNotification } from "@/components/glass/glass-notification";
import { ImageUpload } from "@/components/shared/image-upload";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { MenuView } from "@/components/public-menu/menu-view";

interface PlanInfo {
  id: keyof typeof PLANS;
  name: string;
  templates: TemplateId[];
  branding: BrandingLevel;
  removeBadge: boolean;
}

export function BrandingStudio({
  restaurant,
  initialBranding,
  previewContent,
  plan,
  canEditMedia,
}: {
  restaurant: Restaurant;
  initialBranding: BrandingInput;
  previewContent: MenuContent;
  plan: PlanInfo;
  canEditMedia: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialBranding);
  const [branding, setBranding] = React.useState(initialBranding);
  const [media, setMedia] = React.useState({ logoUrl: restaurant.logoUrl, coverUrl: restaurant.coverUrl });
  const [savedMedia, setSavedMedia] = React.useState(media);
  const [tab, setTab] = React.useState("template");
  const [saving, setSaving] = React.useState(false);
  const allowed = new Set(BRANDING_FIELDS[plan.branding]);
  const can = (field: keyof BrandingInput) => allowed.has(field);
  const dirty = JSON.stringify(branding) !== JSON.stringify(saved) || JSON.stringify(media) !== JSON.stringify(savedMedia);
  const set = <K extends keyof BrandingInput>(key: K, value: BrandingInput[K]) => setBranding((b) => ({ ...b, [key]: value }));
  const lockFor = (field: keyof BrandingInput) => (can(field) ? null : <PlanLock plan={BRANDING_FIELDS.standard.includes(field) ? "Starter" : "Pro"} />);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveBrandingAction(restaurant.id, branding, media);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBranding(res.data);
      setSaved(res.data);
      setSavedMedia(media);
      toast.success("Branding saved", { description: "Your public menu has been updated." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const theme = buildMenuTheme(branding);
  const accentContrast = contrastRatio(branding.primaryColor, theme.isDark ? theme.vars["--mm-surface"] : branding.backgroundColor);

  const row = (label: string, field: keyof BrandingInput, control: React.ReactNode) => (
    <div className={cn(!can(field) && "opacity-60")}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-medium text-espresso-600">{label}</span>
        {lockFor(field)}
      </div>
      {control}
    </div>
  );

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Branding"
        title="Branding studio"
        description="Design how your public menu looks. Changes preview instantly and go live when you save."
        actions={
          <>
            <GlassButton
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() => {
                setBranding(saved);
                setMedia(savedMedia);
              }}
            >
              <RotateCcw /> Discard
            </GlassButton>
            <GlassButton onClick={() => void save()} loading={saving} disabled={!dirty}>
              {!saving && <Save />} Save & publish branding
            </GlassButton>
          </>
        }
      />

      {plan.branding !== "full" && (
        <GlassNotification
          tone="info"
          className="mb-5"
          title={`Some controls are locked on the ${plan.name} plan.`}
          action={
            <GlassButton asChild size="xs" variant="lavender">
              <Link href="/dashboard/billing">Compare plans</Link>
            </GlassButton>
          }
        >
          {plan.branding === "basic" ? "Upgrade to Starter for custom typography and layouts, or Pro for every control." : "Upgrade to Pro for button, card, radius, background and header styles."}
        </GlassNotification>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <GlassTabs
            id="branding-tabs"
            value={tab}
            onValueChange={setTab}
            listClassName="mb-4"
            items={[
              { value: "template", label: "Template", icon: <LayoutTemplate /> },
              { value: "colors", label: "Colours", icon: <Palette /> },
              { value: "type", label: "Typography", icon: <Type /> },
              { value: "layout", label: "Layout", icon: <SlidersHorizontal /> },
              { value: "media", label: "Logo & cover", icon: <ImageIcon /> },
            ]}
          />
          <div className="glass-strong rounded-[26px] p-5 sm:p-6">
            {tab === "template" && (
              <div role="radiogroup" aria-label="Template" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {TEMPLATES.map((t) => {
                  const locked = !plan.templates.includes(t.id);
                  const active = branding.template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        if (locked) {
                          toast.info(`${t.name} is available on ${PLANS[minimumPlanForTemplate(t.id)].name}.`);
                          return;
                        }
                        setBranding({ ...t.branding });
                      }}
                      className={cn(
                        "group overflow-hidden rounded-[20px] border text-left transition-all duration-500 ease-[var(--ease-spring)]",
                        active ? "border-terracotta shadow-[0_0_0_3px_rgb(233_117_66/0.2),var(--shadow-lift)]" : "border-espresso/10 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
                        locked && "opacity-70",
                      )}
                    >
                      <div className="relative aspect-[16/10]">
                        <Image src={t.cover} alt="" fill sizes="320px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 35%, ${t.branding.backgroundColor})` }} />
                        <div className="absolute right-2 top-2">{locked ? <PlanLock plan={PLANS[minimumPlanForTemplate(t.id)].name} /> : null}</div>
                        {active && (
                          <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-terracotta text-white shadow">
                            <Check className="size-3.5" aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className="p-3.5" style={{ background: t.branding.backgroundColor, color: t.branding.theme === "dark" ? "#F7F1EA" : "#241B18" }}>
                        <p className="text-[18px] leading-tight" style={{ fontFamily: fontFamily(t.branding.headingFont) }}>
                          {t.name}
                          {locked && <span className="sr-only"> (requires {PLANS[minimumPlanForTemplate(t.id)].name} plan)</span>}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[12px] opacity-75">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "colors" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <ColorField id="b-primary" label="Primary" value={branding.primaryColor} onChange={(v) => set("primaryColor", v)} disabled={!can("primaryColor")} />
                  <ColorField id="b-secondary" label="Accent" value={branding.secondaryColor} onChange={(v) => set("secondaryColor", v)} disabled={!can("secondaryColor")} />
                  <ColorField id="b-bg" label="Background" value={branding.backgroundColor} onChange={(v) => set("backgroundColor", v)} disabled={!can("backgroundColor")} />
                </div>
                {accentContrast < 3 && (
                  <GlassNotification tone="warning" title="Low contrast primary colour">
                    Prices and links will be automatically darkened for readability (WCAG AA), so they may look different from your swatch.
                  </GlassNotification>
                )}
                {row(
                  "Menu theme",
                  "theme",
                  <Segmented
                    id="b-theme"
                    label="Menu theme"
                    value={branding.theme}
                    onChange={(v) => setBranding((b) => ({ ...b, theme: v, backgroundColor: v === "dark" ? "#141110" : getTemplate(b.template).branding.theme === "light" ? getTemplate(b.template).branding.backgroundColor : "#FFF9F2" }))}
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ]}
                  />,
                )}
                {row(
                  "Background style",
                  "background",
                  <Segmented
                    id="b-bgstyle"
                    label="Background style"
                    disabled={!can("background")}
                    value={branding.background}
                    onChange={(v) => set("background", v)}
                    options={[
                      { value: "solid", label: "Solid" },
                      { value: "gradient", label: "Gradient" },
                      { value: "paper", label: "Paper" },
                    ]}
                  />,
                )}
              </div>
            )}

            {tab === "type" && (
              <div className="space-y-6">
                {(["headingFont", "bodyFont"] as const).map((field) =>
                  row(
                    field === "headingFont" ? "Headings" : "Body text",
                    field,
                    <div role="radiogroup" aria-label={field === "headingFont" ? "Heading font" : "Body font"} className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                      {FONT_OPTIONS.filter((f) => (field === "bodyFont" ? f.kind !== "display" : true)).map((f) => {
                        const active = branding[field] === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!can(field)}
                            onClick={() => set(field, f.id)}
                            className={cn(
                              "rounded-2xl border p-3 text-left transition-all duration-300 disabled:cursor-not-allowed",
                              active ? "border-terracotta bg-terracotta/[0.06] shadow-[0_0_0_3px_rgb(233_117_66/0.12)]" : "border-espresso/10 bg-white/70 hover:border-espresso/25",
                            )}
                          >
                            <span className="block text-[22px] leading-none text-espresso" style={{ fontFamily: fontFamily(f.id) }}>
                              Ag
                            </span>
                            <span className="mt-2 block truncate text-[12px] text-espresso-500">{f.label}</span>
                          </button>
                        );
                      })}
                    </div>,
                  ),
                )}
              </div>
            )}

            {tab === "layout" && (
              <div className="grid gap-6 sm:grid-cols-2">
                {row(
                  "Category navigation",
                  "categoryNav",
                  <Segmented id="b-nav" label="Category navigation" disabled={!can("categoryNav")} value={branding.categoryNav} onChange={(v) => set("categoryNav", v)} options={[{ value: "pills", label: "Pills" }, { value: "underline", label: "Underline" }]} />,
                )}
                {row(
                  "Item layout",
                  "itemLayout",
                  <Segmented id="b-layout" label="Item layout" disabled={!can("itemLayout")} value={branding.itemLayout} onChange={(v) => set("itemLayout", v)} options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} />,
                )}
                {row(
                  "Header",
                  "headerStyle",
                  <Segmented id="b-header" label="Header style" disabled={!can("headerStyle")} value={branding.headerStyle} onChange={(v) => set("headerStyle", v)} options={[{ value: "cover", label: "Cover" }, { value: "centered", label: "Centered" }, { value: "minimal", label: "Minimal" }]} />,
                )}
                {row(
                  "Menu cards",
                  "cardStyle",
                  <Segmented id="b-card" label="Card style" size="sm" disabled={!can("cardStyle")} value={branding.cardStyle} onChange={(v) => set("cardStyle", v)} options={[{ value: "elevated", label: "Elevated" }, { value: "outlined", label: "Outline" }, { value: "flat", label: "Flat" }, { value: "minimal", label: "Minimal" }]} />,
                )}
                {row(
                  "Buttons",
                  "buttonStyle",
                  <Segmented id="b-btn" label="Button style" disabled={!can("buttonStyle")} value={branding.buttonStyle} onChange={(v) => set("buttonStyle", v)} options={[{ value: "pill", label: "Pill" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} />,
                )}
                {row(
                  `Corner radius · ${branding.radius}px`,
                  "radius",
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    aria-label="Corner radius"
                    disabled={!can("radius")}
                    value={branding.radius}
                    onChange={(e) => set("radius", Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-espresso/10 accent-terracotta disabled:cursor-not-allowed"
                  />,
                )}
                {row(
                  "Show dish photos",
                  "showImages",
                  <GlassSwitch checked={branding.showImages} onCheckedChange={(v) => set("showImages", v)} label="Show dish photos" disabled={!can("showImages")} />,
                )}
              </div>
            )}

            {tab === "media" && (
              <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
                {canEditMedia ? (
                  <>
                    <ImageUpload label="Logo" kind="logo" restaurantId={restaurant.id} value={media.logoUrl} onChange={(url) => setMedia((m) => ({ ...m, logoUrl: url }))} aspect="aspect-square" rounded="rounded-[28px]" hint="Square PNG or JPG." />
                    <ImageUpload label="Cover photo" kind="cover" restaurantId={restaurant.id} value={media.coverUrl} onChange={(url) => setMedia((m) => ({ ...m, coverUrl: url }))} hint="Shown behind your name with the Cover header style." />
                  </>
                ) : (
                  <p className="text-sm text-espresso-500">You don&apos;t have permission to change media.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <aside aria-label="Live preview" className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-espresso-500">
            Live preview {dirty && <span className="rounded-full bg-champagne-soft px-2 py-0.5 text-[10px] text-[#8a5a17]">Unsaved</span>}
          </div>
          <PhoneFrame fitHeight className="max-w-[330px]">
            <MenuView mode="preview" restaurant={{ ...restaurant, logoUrl: media.logoUrl, coverUrl: media.coverUrl }} branding={branding} content={previewContent} showBadge={!plan.removeBadge} />
          </PhoneFrame>
        </aside>
      </div>
    </div>
  );
}
