import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck, Leaf, Play } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { GlassButton } from "@/components/glass/glass-button";
import { MenuView } from "@/components/public-menu/menu-view";
import { SAMPLE_MENU, SAMPLE_MENUS, SAMPLE_RESTAURANT } from "@/lib/sample-menu";
import { getTemplate } from "@/lib/templates";
import { PhoneMockup } from "./phone-mockup";
import { Reveal } from "./reveal";
import { Accent } from "./section-heading";

const TRUST = ["No credit card required", "Live in about 10 minutes", "Works on every phone — no app"];

export function Hero() {
  const branding = getTemplate("modern-bistro").branding;

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
      <Aurora className="-z-10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,var(--color-ivory))]" />

      <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="relative z-10 max-w-[640px]">
          <p className="glass-subtle inline-flex h-8 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[12.5px] font-medium text-espresso-600">
            <span className="grid h-5 place-items-center rounded-full bg-espresso px-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ivory">
              Menus
            </span>
            Designed for restaurants, cafés &amp; bars
          </p>

          <h1
            id="hero-title"
            className="mt-7 font-display text-[clamp(2.9rem,6.4vw,5.75rem)] font-medium leading-[0.95] tracking-[-0.045em] text-espresso"
          >
            <span className="block">Beautiful menus.</span>
            <Accent className="block pb-[0.08em]">Happier customers.</Accent>
          </h1>

          <p className="mt-7 max-w-[520px] text-[18px] leading-relaxed text-espresso-600 text-pretty sm:text-[19px]">
            Create stunning digital menus, customize your restaurant&apos;s identity, and share everything with one simple QR code.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <GlassButton asChild size="lg" pill className="px-7">
              <Link href="/signup">
                Get started — it&apos;s free <ArrowRight aria-hidden />
              </Link>
            </GlassButton>
            <GlassButton asChild variant="glass" size="lg" pill className="px-6">
              <Link href="/m/saffron-sage">
                <Play aria-hidden className="fill-current" /> View live demo
              </Link>
            </GlassButton>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5 text-[14px] font-medium text-espresso-600" aria-label="Highlights">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-mint-soft text-mint-ink">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual composition */}
        <Reveal y={30} delay={0.1} className="relative mx-auto h-[680px] w-full max-w-[560px] sm:h-[720px]">
          <div className="absolute inset-x-3 bottom-6 top-14 overflow-hidden rounded-[36px] shadow-[0_30px_70px_-30px_rgb(120_60_30/0.45)] ring-1 ring-white/60 sm:inset-x-0 lg:left-[18%] lg:right-[-6%]">
            <Image
              src="/images/hero/hero-table.jpg"
              alt=""
              fill
              preload
              sizes="(min-width: 1024px) 560px, (min-width: 640px) 560px, 100vw"
              className="object-cover object-[28%_50%]"
            />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(200deg,rgb(255_249_242/0)_40%,rgb(36_27_24/0.18)_100%)]" />
          </div>

          <div className="absolute left-1/2 top-0 -translate-x-1/2 lg:left-[2%] lg:translate-x-0">
            <PhoneMockup float label="Live preview of the Saffron & Sage sample menu built with MenuMint" inert>
              <MenuView
                mode="embed"
                restaurant={SAMPLE_RESTAURANT}
                branding={branding}
                content={SAMPLE_MENU}
                menus={SAMPLE_MENUS}
                menuId={SAMPLE_MENUS[0].id}
                showBadge
              />
            </PhoneMockup>
          </div>

          {/* Analytics chip */}
          <div
            aria-hidden
            className="glass glass-rim absolute right-0 top-[9%] hidden w-[210px] animate-float rounded-[22px] p-4 [--float-rotate:2deg] [animation-delay:-2.5s] sm:block lg:right-[-8%]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-espresso-600">QR scans</span>
              <span className="rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-bold text-mint-ink">+38%</span>
            </div>
            <p className="mt-1 font-display text-[28px] font-medium leading-none tracking-[-0.03em] text-espresso">1,284</p>
            <p className="mt-1 text-[11.5px] text-espresso-500">this week · example</p>
            <svg viewBox="0 0 160 44" className="mt-2 h-11 w-full" fill="none">
              <defs>
                <linearGradient id="hero-spark" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#E97542" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#E97542" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 36 L20 32 L40 34 L60 24 L80 27 L100 16 L120 19 L138 9 L156 5 L156 44 L0 44 Z" fill="url(#hero-spark)" />
              <path d="M0 36 L20 32 L40 34 L60 24 L80 27 L100 16 L120 19 L138 9 L156 5" stroke="#E97542" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="156" cy="5" r="3" fill="#E97542" />
            </svg>
          </div>

          {/* Published chip */}
          <div
            aria-hidden
            className="glass-dark absolute bottom-[3%] right-4 flex animate-float items-center gap-3 rounded-full py-2 pl-2 pr-4 [--float-rotate:-1.5deg] [animation-delay:-4s] lg:right-[2%]"
          >
            <span className="grid size-8 place-items-center rounded-full bg-mint text-espresso">
              <CircleCheck className="size-[18px]" />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold">Published</span>
              <span className="block text-[11.5px] text-ivory/70">Dinner menu · just now</span>
            </span>
          </div>

          {/* Dietary chip */}
          <div
            aria-hidden
            className="glass absolute bottom-[16%] left-0 hidden animate-float items-center gap-1.5 rounded-2xl p-2 [--float-rotate:-2deg] [animation-delay:-1s] sm:flex lg:left-[-10%]"
          >
            <span className="grid size-7 place-items-center rounded-xl bg-mint-soft text-mint-ink">
              <Leaf className="size-4" />
            </span>
            <span className="rounded-lg bg-white/80 px-2 py-1 text-[11.5px] font-semibold text-espresso">Vegan</span>
            <span className="rounded-lg bg-white/80 px-2 py-1 text-[11.5px] font-semibold text-espresso">Gluten-free</span>
            <span className="rounded-lg bg-terracotta/12 px-2 py-1 text-[11.5px] font-semibold text-terracotta-ink">Contains: milk</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
