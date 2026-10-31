import Image from "next/image";
import { Check } from "lucide-react";
import type { FontId } from "@/lib/domain";
import { FONT_OPTIONS, fontFamily } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";

const COLORS = [
  { name: "Primary", hex: "#C8572B" },
  { name: "Accent", hex: "#E8BA77" },
  { name: "Canvas", hex: "#FFF9F2" },
  { name: "Ink", hex: "#241B18" },
  { name: "Herb", hex: "#3F7D5C" },
];

const PAIRS: { heading: FontId; body: FontId; active?: boolean }[] = [
  { heading: "fraunces", body: "dm-sans", active: true },
  { heading: "cormorant", body: "lora" },
  { heading: "archivo-black", body: "space-grotesk" },
];

const label = (id: FontId) => FONT_OPTIONS.find((f) => f.id === id)?.label ?? id;

const POINTS = [
  "Logo, cover photo and restaurant details",
  "Primary, accent and background colours",
  "Ten curated typefaces for headings and body",
  "Button shapes, card styles and corner radius",
  "Light or dark — with automatic contrast checks",
];

function KitLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-500">{children}</p>;
}

function BrandKitCard() {
  const radius = 18;
  return (
    <div
      aria-label="Example brand kit"
      role="group"
      className="glass-strong glass-rim w-full rounded-[28px] p-5 shadow-[0_40px_80px_-30px_rgb(60_30_15/0.5)] sm:p-6"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-[20px] font-semibold tracking-[-0.02em] text-espresso">Brand kit</p>
        <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-[11.5px] font-semibold text-terracotta-ink">Saffron &amp; Sage</span>
      </div>

      <div className="mt-5">
        <KitLabel>Colours</KitLabel>
        <ul className="grid grid-cols-5 gap-2">
          {COLORS.map((c) => (
            <li key={c.name} className="min-w-0">
              <span
                className="block aspect-square rounded-2xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.4)]"
                style={{ background: c.hex }}
              />
              <span className="mt-1.5 block truncate text-[11px] font-semibold text-espresso">{c.name}</span>
              <span className="block truncate font-mono text-[10px] text-espresso-500">{c.hex}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <KitLabel>Type pairing</KitLabel>
        <ul className="space-y-1.5">
          {PAIRS.map((p) => (
            <li
              key={p.heading}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2",
                p.active ? "bg-white ring-2 ring-terracotta/60" : "bg-espresso/[0.035]",
              )}
            >
              <span
                className="w-11 shrink-0 text-[26px] leading-none text-espresso"
                style={{ fontFamily: fontFamily(p.heading), fontWeight: p.heading === "archivo-black" ? 400 : 600 }}
              >
                Aa
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13.5px] text-espresso" style={{ fontFamily: fontFamily(p.heading), fontWeight: p.heading === "archivo-black" ? 400 : 600 }}>
                  {label(p.heading)}
                </span>
                <span className="block truncate text-[12px] text-espresso-600" style={{ fontFamily: fontFamily(p.body) }}>
                  with {label(p.body)} for body text
                </span>
              </span>
              {p.active && (
                <span className="grid size-5 place-items-center rounded-full bg-terracotta text-white">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1.15fr_0.85fr]">
        <div>
          <KitLabel>Buttons</KitLabel>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: "Pill", r: "999px" },
              { name: "Rounded", r: "12px" },
              { name: "Square", r: "3px" },
            ].map((b, i) => (
              <span
                key={b.name}
                className={cn(
                  "inline-flex h-8 items-center px-3 text-[12px] font-semibold",
                  i === 0 ? "bg-[#C8572B] text-white shadow-[0_6px_14px_-6px_rgb(200_87_43/0.7)]" : "bg-[#C8572B]/10 text-[#A9441B]",
                )}
                style={{ borderRadius: b.r }}
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <KitLabel>Corner radius</KitLabel>
          <div className="flex items-center gap-3">
            <div className="relative h-1.5 flex-1 rounded-full bg-espresso/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-terracotta" style={{ width: `${(radius / 32) * 100}%` }} />
              <div
                className="absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgb(36_27_24/0.2),0_3px_8px_rgb(36_27_24/0.15)] ring-1 ring-espresso/10"
                style={{ left: `${(radius / 32) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[12px] font-medium text-espresso">{radius}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandingSection() {
  return (
    <section aria-labelledby="branding-title" className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute right-[-10%] top-[10%] -z-10 h-[560px] w-[560px] rounded-full bg-champagne-soft blur-[130px]" />
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div>
          <SectionHeading
            id="branding-title"
            eyebrow="Branding"
            title={
              <>
                Your identity, <Accent>down to the corner radius.</Accent>
              </>
            }
            lede="Guests should feel your restaurant the moment the menu opens — not a generic app. Every detail is yours to tune, and it all updates live."
          />
          <ul className="mt-9 space-y-3">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p} delay={i * 0.04} className="flex items-center gap-3 text-[15.5px] text-espresso-600">
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-terracotta/10 text-terracotta-ink">
                  <Check className="size-3.5" strokeWidth={2.75} />
                </span>
                {p}
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="relative">
          <Reveal className="relative ml-auto aspect-[4/5] w-full overflow-hidden rounded-[36px] shadow-[0_40px_80px_-40px_rgb(120_60_30/0.55)] sm:w-[78%] lg:aspect-[1086/1448]">
            <Image
              src="/images/hero/chef-plating.jpg"
              alt="A chef finishing a plate of seared scallops with micro herbs"
              fill
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 78vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal
            delay={0.12}
            y={36}
            className="relative z-10 -mt-28 mx-3 sm:absolute sm:bottom-10 sm:left-0 sm:mx-0 sm:mt-0 sm:w-[min(430px,62%)] lg:bottom-14 lg:w-[min(440px,64%)]"
          >
            <BrandKitCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
