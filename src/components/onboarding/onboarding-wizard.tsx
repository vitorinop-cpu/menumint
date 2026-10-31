"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  PartyPopper,
  Plus,
  QrCode,
  Rocket,
  Trash2,
  Wand2,
} from "lucide-react";
import type { z } from "zod";
import type { BrandingInput, Currency, FontId, OnboardingDraft, QrCode as QrCodeT, Restaurant, TemplateId } from "@/lib/domain";
import { CUISINES, CURRENCIES } from "@/lib/domain";
import { restaurantInfoSchema } from "@/lib/validation";
import { TEMPLATES, getTemplate, fontFamily } from "@/lib/templates";
import { minimumPlanForTemplate, PLANS, type BrandingLevel, type QrLevel } from "@/lib/plans";
import { cn, parsePrice, slugify } from "@/lib/utils";
import {
  checkSlugAction,
  createFirstMenuAction,
  finishOnboardingAction,
  saveOnboardingProgressAction,
  saveRestaurantDetailsAction,
  saveRestaurantInfoAction,
} from "@/app/actions/onboarding";
import { saveBrandingAction } from "@/app/actions/branding";
import { createQrAction } from "@/app/actions/qr";
import { publishMenuAction } from "@/app/actions/menus";
import { GlassButton } from "@/components/glass/glass-button";
import { Field, GlassInput, GlassSelect } from "@/components/glass/glass-input";
import { ColorField, PlanLock } from "@/components/glass/primitives";
import { Segmented } from "@/components/glass/glass-tabs";
import { GlassNotification } from "@/components/glass/glass-notification";
import { ImageUpload } from "@/components/shared/image-upload";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { QrPreview } from "@/components/qr/qr-preview";
import { MenuView } from "@/components/public-menu/menu-view";
import { Logo } from "@/components/brand/logo";
import { Aurora } from "@/components/brand/aurora";
import { downloadQrPng, downloadQrSvg } from "@/lib/qr-client";
import { useOrigin } from "@/lib/hooks";

const STEPS = ["Welcome", "Restaurant", "Photos", "Cuisine", "Template", "Brand", "Menu", "QR code", "Publish"];

const FONT_PAIRS: { heading: FontId; body: FontId; label: string }[] = [
  { heading: "fraunces", body: "dm-sans", label: "Editorial" },
  { heading: "cormorant", body: "lora", label: "Classic" },
  { heading: "playfair", body: "inter", label: "Refined" },
  { heading: "dm-serif", body: "dm-sans", label: "Friendly" },
  { heading: "archivo-black", body: "space-grotesk", label: "Bold" },
  { heading: "dm-sans", body: "dm-sans", label: "Minimal" },
];

const SWATCHES = ["#C8572B", "#7A2E2E", "#1F6F8B", "#2F6B4F", "#5B45C4", "#2B2B2B", "#D99A1E"];

interface PlanInfo {
  id: keyof typeof PLANS;
  name: string;
  templates: TemplateId[];
  branding: BrandingLevel;
  qr: QrLevel;
}

type Data = OnboardingDraft["data"];

export function OnboardingWizard({
  userName,
  initialDraft,
  initialRestaurant,
  initialBranding,
  initialQr,
  initialPublished,
  plan,
  hasOtherRestaurants,
}: {
  userName: string;
  initialDraft: OnboardingDraft;
  initialRestaurant: Restaurant | null;
  initialBranding: BrandingInput;
  initialQr: QrCodeT | null;
  initialPublished: boolean;
  plan: PlanInfo;
  hasOtherRestaurants: boolean;
}) {
  const [step, setStep] = React.useState(initialDraft.data.restaurantId ? initialDraft.step : Math.min(initialDraft.step, 1));
  const [direction, setDirection] = React.useState(1);
  const [data, setData] = React.useState<Data>({
    currency: "USD",
    menuName: "Main menu",
    firstCategory: "Starters",
    firstItems: [
      { name: "", price: "", description: "" },
      { name: "", price: "", description: "" },
    ],
    ...initialDraft.data,
    name: initialDraft.data.name ?? initialRestaurant?.name,
    logoUrl: initialDraft.data.logoUrl ?? initialRestaurant?.logoUrl ?? null,
    coverUrl: initialDraft.data.coverUrl ?? initialRestaurant?.coverUrl ?? null,
  });
  const [branding, setBranding] = React.useState<BrandingInput>(initialBranding);
  const [qr, setQr] = React.useState<QrCodeT | null>(initialQr);
  const [published, setPublished] = React.useState(initialPublished);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; upgrade?: string } | null>(null);
  const origin = useOrigin();

  const update = (patch: Partial<Data>) => setData((d) => ({ ...d, ...patch }));

  const go = async (next: number, patch: Partial<Data> = {}) => {
    const merged = { ...data, ...patch };
    setData(merged);
    setDirection(next > step ? 1 : -1);
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    void saveOnboardingProgressAction({ step: next, data: merged });
  };

  const run = async <T,>(fn: () => Promise<T>) => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  };

  const restaurantId = data.restaurantId ?? null;
  const publicUrl = origin && restaurantId && data.slug ? `${origin}/m/${data.slug}` : "";
  const qrUrl = origin && qr ? `${origin}/q/${qr.code}` : "";

  // ── Live preview content ──
  const previewItems = (data.firstItems ?? []).filter((i) => i.name);
  const previewCategoryId = "00000000-0000-4000-8000-0000000000c1";
  const preview = {
    restaurant: {
      id: restaurantId ?? "00000000-0000-4000-8000-000000000000",
      name: data.name || "Your restaurant",
      tagline: data.tagline || (data.cuisine ? `${data.cuisine} kitchen` : "Your tagline goes here"),
      logoUrl: data.logoUrl ?? null,
      coverUrl: data.coverUrl ?? getTemplate(branding.template).cover,
      address: data.address ?? "",
      phone: data.phone ?? "",
      website: "",
      slug: data.slug ?? "preview",
    },
    content: {
      name: data.menuName || "Main menu",
      description: "",
      currency: (data.currency ?? "USD") as Currency,
      categories: [
        {
          id: previewCategoryId,
          name: data.firstCategory || "Starters",
          description: "",
          position: 0,
          items: (previewItems.length
            ? previewItems
            : [
                { name: "Burrata & tomatoes", price: "16", description: "Basil oil, sea salt" },
                { name: "Saffron risotto", price: "24", description: "Crispy sage" },
              ]
          ).map((i, idx) => ({
            id: `00000000-0000-4000-8000-00000000010${idx}`,
            categoryId: previewCategoryId,
            name: i.name,
            description: i.description,
            price: parsePrice(i.price, data.currency ?? "USD") ?? 0,
            available: true,
            featured: idx === 0,
            archived: false,
            dietary: [],
            allergens: [],
            imageUrl: previewItems.length ? null : idx === 0 ? "/images/dishes/burrata.jpg" : "/images/dishes/risotto.jpg",
            position: idx,
          })),
        },
      ],
    },
  };

  const stepBody = (() => {
    switch (step) {
      case 0:
        return (
          <WelcomeStep
            userName={userName}
            addingAnother={hasOtherRestaurants && !restaurantId}
            onStart={() => go(1)}
          />
        );
      case 1:
        return (
          <RestaurantStep
            data={data}
            restaurantId={restaurantId}
            busy={busy}
            onSubmit={(values) =>
              run(async () => {
                const res = await saveRestaurantInfoAction(values, restaurantId);
                if (!res.ok) {
                  setError({ message: res.error, upgrade: "upgrade" in res ? res.upgrade : undefined });
                  return;
                }
                await go(2, { ...values, restaurantId: res.data.restaurantId });
              })
            }
          />
        );
      case 2:
        return restaurantId ? (
          <div className="space-y-5">
            <ImageUpload
              label="Logo"
              kind="logo"
              restaurantId={restaurantId}
              value={data.logoUrl ?? null}
              onChange={(url) => update({ logoUrl: url })}
              aspect="aspect-square"
              className="max-w-[180px]"
              rounded="rounded-[28px]"
              hint="Square works best."
            />
            <ImageUpload
              label="Cover photo"
              kind="cover"
              restaurantId={restaurantId}
              value={data.coverUrl ?? null}
              onChange={(url) => update({ coverUrl: url })}
              hint="A wide photo of your dining room, bar or signature dish."
            />
            <StepNav
              onBack={() => go(1)}
              busy={busy}
              nextLabel={data.logoUrl || data.coverUrl ? "Continue" : "Skip for now"}
              onNext={() =>
                run(async () => {
                  const res = await saveRestaurantDetailsAction(restaurantId, { logoUrl: data.logoUrl ?? null, coverUrl: data.coverUrl ?? null });
                  if (!res.ok) return setError({ message: res.error });
                  await go(3);
                })
              }
            />
          </div>
        ) : null;
      case 3:
        return (
          <div>
            <div role="radiogroup" aria-label="Cuisine" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CUISINES.map((c) => {
                const active = data.cuisine === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ cuisine: c })}
                    className={cn(
                      "flex h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition-all duration-300 ease-[var(--ease-spring)] active:scale-[0.97]",
                      active ? "border-terracotta bg-terracotta/[0.08] text-espresso shadow-[0_0_0_3px_rgb(233_117_66/0.15)]" : "border-espresso/10 bg-white/70 text-espresso-600 hover:border-espresso/25 hover:bg-white",
                    )}
                  >
                    {c}
                    {active && <Check className="size-4 text-terracotta" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <StepNav
              onBack={() => go(2)}
              busy={busy}
              nextDisabled={!data.cuisine}
              onNext={() =>
                run(async () => {
                  const res = await saveRestaurantDetailsAction(restaurantId!, { cuisine: data.cuisine });
                  if (!res.ok) return setError({ message: res.error });
                  await go(4);
                })
              }
            />
          </div>
        );
      case 4:
        return (
          <div>
            <div role="radiogroup" aria-label="Menu template" className="grid gap-3 sm:grid-cols-2">
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
                        setError({ message: `${t.name} is available on the ${PLANS[minimumPlanForTemplate(t.id)].name} plan. You can upgrade any time from Billing.` });
                        return;
                      }
                      setError(null);
                      setBranding({ ...t.branding });
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-[22px] border bg-white text-left transition-all duration-500 ease-[var(--ease-spring)]",
                      active ? "border-terracotta shadow-[0_0_0_3px_rgb(233_117_66/0.2),var(--shadow-lift)]" : "border-espresso/10 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
                      locked && "opacity-75",
                    )}
                  >
                    <div className="relative h-24">
                      <Image src={t.cover} alt="" fill sizes="300px" className="object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${t.branding.backgroundColor})` }} />
                      {locked && <PlanLock plan={PLANS[minimumPlanForTemplate(t.id)].name} className="absolute right-2 top-2" />}
                      {active && (
                        <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-terracotta text-white">
                          <Check className="size-3.5" aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="p-3.5" style={{ background: t.branding.backgroundColor, color: t.branding.theme === "dark" ? "#F7F1EA" : "#241B18" }}>
                      <p className="text-[17px] leading-tight" style={{ fontFamily: fontFamily(t.branding.headingFont) }}>
                        {t.name}
                        {locked && <span className="sr-only"> (requires {PLANS[minimumPlanForTemplate(t.id)].name} plan)</span>}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[12px] opacity-75">{t.description}</p>
                      <div className="mt-2 flex gap-1" aria-hidden>
                        {[t.branding.primaryColor, t.branding.secondaryColor, t.branding.backgroundColor].map((c) => (
                          <span key={c} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <StepNav
              onBack={() => go(3)}
              busy={busy}
              onNext={() =>
                run(async () => {
                  const res = await saveBrandingAction(restaurantId!, branding);
                  if (!res.ok) return setError({ message: res.error, upgrade: res.upgrade });
                  setBranding(res.data);
                  await go(5, { template: branding.template });
                })
              }
            />
          </div>
        );
      case 5: {
        const fontsLocked = plan.branding === "basic";
        return (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-[13px] font-medium text-espresso-600">Quick picks</p>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use ${c} as primary colour`}
                    aria-pressed={branding.primaryColor.toLowerCase() === c.toLowerCase()}
                    onClick={() => setBranding((b) => ({ ...b, primaryColor: c }))}
                    className={cn(
                      "size-9 rounded-full ring-1 ring-black/10 transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-110",
                      branding.primaryColor.toLowerCase() === c.toLowerCase() && "ring-[3px] ring-offset-2 ring-espresso/70",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField id="primary" label="Primary colour" value={branding.primaryColor} onChange={(v) => setBranding((b) => ({ ...b, primaryColor: v }))} />
              <ColorField id="secondary" label="Accent colour" value={branding.secondaryColor} onChange={(v) => setBranding((b) => ({ ...b, secondaryColor: v }))} />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-espresso-600">Menu theme</p>
              <Segmented
                id="ob-theme"
                label="Menu theme"
                value={branding.theme}
                onChange={(theme) =>
                  setBranding((b) => ({
                    ...b,
                    theme,
                    backgroundColor: theme === "dark" ? (getTemplate(b.template).branding.theme === "dark" ? getTemplate(b.template).branding.backgroundColor : "#141110") : getTemplate(b.template).branding.theme === "light" ? getTemplate(b.template).branding.backgroundColor : "#FFF9F2",
                  }))
                }
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[13px] font-medium text-espresso-600">Typography</p>
                {fontsLocked && <PlanLock plan="Starter" />}
              </div>
              <div role="radiogroup" aria-label="Font pairing" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FONT_PAIRS.map((p) => {
                  const active = branding.headingFont === p.heading && branding.bodyFont === p.body;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={fontsLocked && !active}
                      onClick={() => setBranding((b) => ({ ...b, headingFont: p.heading, bodyFont: p.body }))}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
                        active ? "border-terracotta bg-terracotta/[0.06]" : "border-espresso/10 bg-white/70 hover:border-espresso/25",
                      )}
                    >
                      <span className="block text-[20px] leading-none text-espresso" style={{ fontFamily: fontFamily(p.heading) }}>
                        Aa
                      </span>
                      <span className="mt-1.5 block text-xs text-espresso-500" style={{ fontFamily: fontFamily(p.body) }}>
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {fontsLocked && <p className="mt-2 text-[12.5px] text-espresso-500">Your template&apos;s fonts are included. Custom typography unlocks on Starter.</p>}
            </div>
            <StepNav
              onBack={() => go(4)}
              busy={busy}
              onNext={() =>
                run(async () => {
                  const res = await saveBrandingAction(restaurantId!, branding);
                  if (!res.ok) return setError({ message: res.error, upgrade: res.upgrade });
                  setBranding(res.data);
                  await go(6, { primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor });
                })
              }
            />
          </div>
        );
      }
      case 6:
        return (
          <MenuStep
            data={data}
            update={update}
            busy={busy}
            onBack={() => go(5)}
            onNext={() =>
              run(async () => {
                const res = await createFirstMenuAction(
                  restaurantId!,
                  { menuName: data.menuName, firstCategory: data.firstCategory, firstItems: data.firstItems ?? [] },
                  data.menuId,
                );
                if (!res.ok) return setError({ message: res.error, upgrade: "upgrade" in res ? res.upgrade : undefined });
                await go(7, { menuId: res.data.menuId });
              })
            }
          />
        );
      case 7:
        return (
          <div>
            {qr ? (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="w-56 shrink-0 rounded-[24px] bg-white p-4 shadow-[var(--shadow-lift)]">
                  <QrPreview text={qrUrl} style={qr.style} label={`QR code linking to ${qrUrl}`} />
                </div>
                <div className="space-y-3 text-sm text-espresso-600">
                  <p>
                    This code points to <span className="font-mono text-[12.5px] text-espresso">{qrUrl.replace(/^https?:\/\//, "")}</span>, a
                    permanent link. Change menus any time — the printed code keeps working.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <GlassButton
                      type="button"
                      size="sm"
                      variant="dark"
                      onClick={() => downloadQrPng({ text: qrUrl, style: qr.style }, `${data.slug}-qr.png`).catch(() => toast.error("Download failed"))}
                    >
                      <Download /> PNG
                    </GlassButton>
                    <GlassButton type="button" size="sm" variant="glass" onClick={() => downloadQrSvg({ text: qrUrl, style: qr.style }, `${data.slug}-qr.svg`)}>
                      <Download /> SVG
                    </GlassButton>
                  </div>
                  <p className="text-[12.5px] text-espresso-500">Style, colours and logos can be customised later in QR Studio.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-espresso/15 bg-white/50 p-8 text-center">
                <QrCode className="mx-auto size-10 text-terracotta" aria-hidden />
                <p className="mt-3 font-medium text-espresso">Generate a QR code for your tables</p>
                <p className="mt-1 text-sm text-espresso-500">Guests scan it to open your menu instantly — no app needed.</p>
                <GlassButton
                  type="button"
                  className="mt-5"
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      const res = await createQrAction(restaurantId!, {
                        name: "Table QR",
                        menuId: data.menuId ?? null,
                        style: { fg: "#000000", bg: "#FFFFFF", dotStyle: "square", cornerStyle: "square", logo: false, frameLabel: "Scan for menu" },
                      });
                      if (!res.ok) return setError({ message: res.error });
                      setQr(res.data);
                      update({ qrCodeId: res.data.id });
                      void saveOnboardingProgressAction({ step: 7, data: { ...data, qrCodeId: res.data.id } });
                    })
                  }
                >
                  <Wand2 /> Generate QR code
                </GlassButton>
              </div>
            )}
            <StepNav onBack={() => go(6)} busy={busy} nextDisabled={!qr} onNext={() => go(8)} />
          </div>
        );
      case 8:
        return (
          <div>
            {published ? (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-[24px] bg-mint-soft/70 p-6 text-center">
                <PartyPopper className="mx-auto size-10 text-mint-ink" aria-hidden />
                <p className="mt-3 font-display text-2xl text-espresso">You&apos;re live!</p>
                <p className="mt-1 text-sm text-espresso-600">Your menu is published at</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="font-mono text-[13px] font-medium text-terracotta-ink underline-offset-2 hover:underline">
                    {publicUrl.replace(/^https?:\/\//, "")}
                  </a>
                  <button
                    type="button"
                    aria-label="Copy link"
                    className="grid size-7 place-items-center rounded-lg hover:bg-white/70"
                    onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success("Link copied"))}
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <GlassButton asChild variant="glass" size="sm">
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink /> View live menu
                    </a>
                  </GlassButton>
                  <form action={finishOnboardingAction}>
                    <GlassButton type="submit" size="sm">
                      Go to dashboard <ArrowRight />
                    </GlassButton>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {[
                    ["Restaurant profile", Boolean(data.name)],
                    ["Branding & template", true],
                    ["First menu with dishes", Boolean(data.menuId)],
                    ["QR code generated", Boolean(qr)],
                  ].map(([label, ok]) => (
                    <li key={String(label)} className="flex items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2.5">
                      <span className={cn("grid size-5 place-items-center rounded-full", ok ? "bg-mint text-mint-ink" : "bg-espresso/10")}>
                        <Check className="size-3" aria-hidden />
                      </span>
                      <span className="text-espresso">{label}</span>
                    </li>
                  ))}
                </ul>
                <GlassButton
                  type="button"
                  size="lg"
                  className="w-full"
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      const res = await publishMenuAction(data.menuId!);
                      if (!res.ok) return setError({ message: res.error });
                      setPublished(true);
                      toast.success("Menu published");
                    })
                  }
                >
                  <Rocket /> Publish my menu
                </GlassButton>
                <div className="flex justify-between">
                  <GlassButton type="button" variant="ghost" size="sm" onClick={() => go(7)}>
                    <ArrowLeft /> Back
                  </GlassButton>
                  <form action={finishOnboardingAction}>
                    <GlassButton type="submit" variant="ghost" size="sm">
                      Publish later
                    </GlassButton>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  })();

  const titles: [string, string][] = [
    ["", ""],
    ["Tell us about your restaurant", "This appears at the top of your menu. You can change it later."],
    ["Add your logo and cover", "Great photos make guests hungry. Both are optional."],
    ["What kind of food do you serve?", "We'll use this to tailor suggestions."],
    ["Choose a menu template", "Each template is a complete design system for your menu."],
    ["Make it yours", "Pick colours and type that match your space."],
    ["Create your first menu", "Start with a few dishes — the full editor is waiting for you after this."],
    ["Your QR code", "One code for every table, window and flyer."],
    ["Ready to publish", "Publishing makes your menu public at its link and QR code."],
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Aurora intensity="soft" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo href={hasOtherRestaurants ? "/dashboard" : "/"} />
        <span className="text-sm text-espresso-500">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      <nav aria-label="Setup progress" className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <ol className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span className="sr-only">
                {label}: {i < step ? "complete" : i === step ? "current" : "upcoming"}
              </span>
              <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-espresso/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#FFC6A6,#E97542)]"
                  initial={false}
                  animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>
              <span aria-hidden className={cn("mt-1.5 hidden text-[11px] font-medium md:block", i <= step ? "text-espresso" : "text-espresso-400")}>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <main id="main" className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12">
        <div className="min-w-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              aria-labelledby="step-title"
            >
              {step > 0 && (
                <div className="mb-7">
                  <h1 id="step-title" className="font-display text-[clamp(1.9rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.025em] text-espresso">
                    {titles[step][0]}
                  </h1>
                  <p className="mt-2 text-espresso-500">{titles[step][1]}</p>
                </div>
              )}
              {error && (
                <GlassNotification
                  tone="warning"
                  title={error.message}
                  className="mb-5"
                  action={
                    error.upgrade && hasOtherRestaurants ? (
                      <GlassButton asChild size="xs" variant="lavender">
                        <Link href="/dashboard/billing">Upgrade</Link>
                      </GlassButton>
                    ) : undefined
                  }
                />
              )}
              <div className={cn(step > 0 && "glass-strong rounded-[28px] p-5 sm:p-7")}>{stepBody}</div>
            </motion.section>
          </AnimatePresence>
        </div>
        <aside className={cn("lg:block", step === 8 ? "block" : "hidden")} aria-label="Menu preview">
          <div className="lg:sticky lg:top-8">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-espresso-500">Live preview</p>
            <PhoneFrame>
              <MenuView mode="embed" restaurant={preview.restaurant} branding={branding} content={preview.content} showBadge={plan.id === "free" || plan.id === "starter"} />
            </PhoneFrame>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  busy,
  nextDisabled,
  nextLabel = "Continue",
  submit,
}: {
  onBack?: () => void;
  onNext?: () => void;
  busy?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  submit?: boolean;
}) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3">
      {onBack ? (
        <GlassButton type="button" variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft /> Back
        </GlassButton>
      ) : (
        <span />
      )}
      <GlassButton type={submit ? "submit" : "button"} onClick={submit ? undefined : onNext} loading={busy} disabled={nextDisabled}>
        {nextLabel} {!busy && <ArrowRight />}
      </GlassButton>
    </div>
  );
}

function WelcomeStep({ userName, onStart, addingAnother }: { userName: string; onStart: () => void; addingAnother: boolean }) {
  const first = userName.split(" ")[0] || "there";
  return (
    <div className="pt-4 lg:pt-10">
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-terracotta-ink shadow-[var(--shadow-soft)]"
      >
        {addingAnother ? "New location" : "Welcome to MenuMint"}
      </motion.span>
      <h1 id="step-title" className="mt-5 font-display text-[clamp(2.6rem,6vw,4.4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-espresso">
        {addingAnother ? (
          <>Let&apos;s add another restaurant.</>
        ) : (
          <>
            Hi {first}, let&apos;s build your <em className="bg-[linear-gradient(90deg,#E97542,#C8572B)] bg-clip-text not-italic text-transparent">first menu.</em>
          </>
        )}
      </h1>
      <p className="mt-5 max-w-lg text-lg text-espresso-500">
        In about five minutes you&apos;ll have a branded digital menu, a QR code for your tables, and a link to share. Your progress saves as you go.
      </p>
      <ul className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
        {["Restaurant details", "Your brand", "Menu + QR"].map((t, i) => (
          <li key={t} className="glass rounded-2xl p-4">
            <span className="font-display text-2xl text-terracotta">0{i + 1}</span>
            <p className="mt-1 text-sm font-medium text-espresso">{t}</p>
          </li>
        ))}
      </ul>
      <GlassButton size="lg" className="mt-9" onClick={onStart}>
        Let&apos;s go <ArrowRight />
      </GlassButton>
    </div>
  );
}

type InfoValues = z.input<typeof restaurantInfoSchema>;

function RestaurantStep({
  data,
  restaurantId,
  busy,
  onSubmit,
}: {
  data: Data;
  restaurantId: string | null;
  busy: boolean;
  onSubmit: (v: z.output<typeof restaurantInfoSchema>) => void;
}) {
  const form = useForm<InfoValues, unknown, z.output<typeof restaurantInfoSchema>>({
    resolver: zodResolver(restaurantInfoSchema),
    defaultValues: {
      name: data.name ?? "",
      slug: data.slug ?? "",
      tagline: data.tagline ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      currency: data.currency ?? "USD",
    },
  });
  const { errors } = form.formState;
  const [slugTouched, setSlugTouched] = React.useState(Boolean(data.slug));
  const [slugState, setSlugState] = React.useState<{ checking: boolean; available: boolean | null; reason: string }>({
    checking: false,
    available: null,
    reason: "",
  });
  const slug = form.watch("slug");

  React.useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugState({ checking: false, available: null, reason: "" });
      return;
    }
    setSlugState((s) => ({ ...s, checking: true }));
    const t = setTimeout(async () => {
      const res = await checkSlugAction(slug, restaurantId ?? undefined);
      setSlugState({ checking: false, available: res.available, reason: res.reason });
    }, 350);
    return () => clearTimeout(t);
  }, [slug, restaurantId]);

  const nameField = form.register("name");
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => {
        if (slugState.available === false) {
          form.setError("slug", { message: slugState.reason || "That link is taken" });
          return;
        }
        onSubmit(v);
      })}
      className="space-y-4"
    >
      <Field label="Restaurant name" htmlFor="name" error={errors.name?.message}>
        <GlassInput
          id="name"
          autoFocus
          placeholder="e.g. Saffron & Sage"
          aria-invalid={!!errors.name}
          {...nameField}
          onChange={(e) => {
            void nameField.onChange(e);
            if (!slugTouched) form.setValue("slug", slugify(e.target.value), { shouldValidate: e.target.value.length > 2 });
          }}
        />
      </Field>
      <div>
        <label htmlFor="slug" className="mb-1.5 block text-[13px] font-medium text-espresso-600">
          Menu link
        </label>
        <div className="flex items-center overflow-hidden rounded-[13px] border border-espresso/12 bg-white/85 focus-within:border-terracotta/70 focus-within:shadow-[0_0_0_4px_rgb(233_117_66/0.14)]">
          <span className="select-none whitespace-nowrap pl-3.5 text-[14px] text-espresso-400">menumint.app/m/</span>
          <input
            id="slug"
            className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-[15px] text-espresso outline-none"
            aria-invalid={!!errors.slug || slugState.available === false}
            aria-describedby="slug-status"
            {...form.register("slug", { onChange: () => setSlugTouched(true) })}
          />
          <span className="pr-3" aria-hidden>
            {slugState.checking ? (
              <Loader2 className="size-4 animate-spin text-espresso-400" />
            ) : slugState.available ? (
              <Check className="size-4 text-mint-ink" />
            ) : null}
          </span>
        </div>
        <p id="slug-status" role="status" className={cn("mt-1.5 text-[13px]", errors.slug || slugState.available === false ? "font-medium text-danger" : "text-espresso-500")}>
          {errors.slug?.message ?? (slugState.available === false ? slugState.reason : slugState.available ? "Nice — that link is available." : "Lowercase letters, numbers and dashes.")}
        </p>
      </div>
      <Field label="Tagline" htmlFor="tagline" error={errors.tagline?.message} hint="Optional — a short line under your name.">
        <GlassInput id="tagline" placeholder="Mediterranean kitchen & natural wine" {...form.register("tagline")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" htmlFor="address" error={errors.address?.message}>
          <GlassInput id="address" autoComplete="street-address" {...form.register("address")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <GlassInput id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
        </Field>
      </div>
      <Field label="Currency" htmlFor="currency" className="max-w-[200px]">
        <GlassSelect id="currency" {...form.register("currency")}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </GlassSelect>
      </Field>
      <div className="flex justify-end pt-3">
        <GlassButton type="submit" loading={busy}>
          Continue {!busy && <ArrowRight />}
        </GlassButton>
      </div>
    </form>
  );
}

function MenuStep({
  data,
  update,
  busy,
  onBack,
  onNext,
}: {
  data: Data;
  update: (p: Partial<Data>) => void;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const items = data.firstItems ?? [];
  const setItem = (i: number, patch: Partial<(typeof items)[number]>) => update({ firstItems: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const valid = Boolean(data.menuName?.trim() && data.firstCategory?.trim() && items.some((i) => i.name.trim()));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Menu name" htmlFor="menuName">
          <GlassInput id="menuName" value={data.menuName ?? ""} onChange={(e) => update({ menuName: e.target.value })} placeholder="Dinner" />
        </Field>
        <Field label="First category" htmlFor="firstCategory">
          <GlassInput id="firstCategory" value={data.firstCategory ?? ""} onChange={(e) => update({ firstCategory: e.target.value })} placeholder="Starters" />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-espresso-600">Dishes</legend>
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {items.map((it, i) => (
              <motion.li
                key={i}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-espresso/10 bg-white/70 p-3"
              >
                <div className="grid grid-cols-[1fr_96px_auto] gap-2">
                  <GlassInput aria-label={`Dish ${i + 1} name`} placeholder="Dish name" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                  <GlassInput aria-label={`Dish ${i + 1} price`} placeholder="0.00" inputMode="decimal" value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} />
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove dish ${i + 1}`}
                    disabled={items.length === 1}
                    onClick={() => update({ firstItems: items.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 />
                  </GlassButton>
                </div>
                <GlassInput
                  aria-label={`Dish ${i + 1} description`}
                  className="mt-2 h-10 text-sm"
                  placeholder="Short description (optional)"
                  value={it.description}
                  onChange={(e) => setItem(i, { description: e.target.value })}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {items.length < 6 && (
          <GlassButton type="button" variant="outline" size="sm" className="mt-3" onClick={() => update({ firstItems: [...items, { name: "", price: "", description: "" }] })}>
            <Plus /> Add dish
          </GlassButton>
        )}
      </fieldset>
      <StepNav onBack={onBack} onNext={onNext} busy={busy} nextDisabled={!valid} nextLabel="Create menu" />
    </div>
  );
}
