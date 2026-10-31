import Image from "next/image";
import { ArrowRight, Check, CircleCheck, Eye, GripVertical, Layers, Leaf, MousePointerClick, Rocket, Smartphone, TrendingUp, Wheat } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";

function CardText({ icon, title, children, dark }: { icon: React.ReactNode; title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]",
          dark ? "bg-white/10 text-peach" : "bg-terracotta/10 text-terracotta-ink",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <h3 className={cn("mt-4 text-[19px] font-semibold tracking-[-0.02em]", dark ? "text-ivory" : "text-espresso")}>{title}</h3>
      <p className={cn("mt-1.5 max-w-md text-[15px] leading-relaxed", dark ? "text-ivory/75" : "text-espresso-600")}>{children}</p>
    </div>
  );
}

const BUILDER_ROWS = [
  { name: "Burrata & Heirloom Tomatoes", price: "$16", img: "/images/dishes/burrata.jpg" },
  { name: "Charred Octopus", price: "$22", img: "/images/dishes/octopus.jpg", lifted: true },
  { name: "Saffron Risotto", price: "$24", img: "/images/dishes/risotto.jpg" },
];

function BuilderVignette() {
  return (
    <div aria-hidden className="glass-strong relative rounded-[22px] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-espresso">Small Plates</span>
          <span className="rounded-full bg-espresso/[0.06] px-2 py-0.5 text-[11px] font-semibold text-espresso-600">3 items</span>
        </div>
        <span className="rounded-lg border border-dashed border-espresso/20 px-2.5 py-1 text-[11.5px] font-medium text-espresso-500">+ Add item</span>
      </div>
      <ul className="mt-4 space-y-2">
        {BUILDER_ROWS.map((r) => (
          <li key={r.name} className="relative">
            {r.lifted && <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-terracotta/35 bg-terracotta/[0.04]" />}
            <div
              className={cn(
                "relative flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 ring-1 ring-espresso/[0.07]",
                r.lifted &&
                  "translate-x-3 -translate-y-2 rotate-[-1.6deg] shadow-[0_2px_4px_rgb(36_27_24/0.06),0_24px_40px_-14px_rgb(120_60_30/0.4)] ring-2 ring-terracotta/50 sm:translate-x-6",
              )}
            >
              <GripVertical className={cn("size-4 shrink-0", r.lifted ? "text-terracotta" : "text-espresso-400")} />
              <span className="relative size-10 shrink-0 overflow-hidden rounded-xl">
                <Image src={r.img} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-espresso">{r.name}</span>
              <span className="text-[14px] font-semibold text-espresso-600">{r.price}</span>
              {r.lifted && (
                <MousePointerClick className="absolute -bottom-3 right-10 size-6 fill-white text-espresso drop-shadow-md" strokeWidth={1.6} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LivePreviewVignette() {
  return (
    <div aria-hidden className="flex items-center gap-3">
      <div className="glass-strong flex-1 space-y-2.5 rounded-[20px] p-3.5">
        <div>
          <span className="text-[11px] font-semibold text-espresso-500">Name</span>
          <div className="mt-1 truncate rounded-xl border border-espresso/10 bg-white px-3 py-2 text-[13px] text-espresso">Saffron Risotto</div>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-espresso-500">Price</span>
          <div className="mt-1 flex items-center rounded-xl border border-terracotta/60 bg-white px-3 py-2 text-[13px] text-espresso shadow-[0_0_0_4px_rgb(233_117_66/0.12)]">
            $26<span className="ml-px inline-block h-4 w-[1.5px] bg-terracotta" />
          </div>
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-espresso-400" />
      <div className="w-[46%] shrink-0 rounded-[22px] bg-espresso p-1.5 shadow-[0_20px_40px_-18px_rgb(36_27_24/0.5)]">
        <div className="overflow-hidden rounded-[17px] bg-ivory">
          <div className="relative aspect-[4/3]">
            <Image src="/images/dishes/risotto.jpg" alt="" fill sizes="160px" className="object-cover" />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-mint-ink">
              <span className="size-1.5 rounded-full bg-mint-ink" /> Live
            </span>
          </div>
          <div className="p-2.5">
            <p className="truncate font-display text-[13px] font-semibold text-espresso">Saffron Risotto</p>
            <p className="mt-0.5 text-[12px] font-bold text-terracotta-ink">$26</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DietaryVignette() {
  const highlighted = new Set(["milk", "gluten", "tree-nuts"]);
  return (
    <div aria-hidden>
      <div className="flex flex-wrap gap-1.5">
        {DIETARY_TAGS.map((d, i) => (
          <span
            key={d.id}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold",
              i < 3 ? "bg-mint-soft text-mint-ink" : "bg-white/80 text-espresso-600 ring-1 ring-espresso/[0.07]",
            )}
          >
            {i < 3 && <Check className="size-3" strokeWidth={3} />}
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/70 p-3 ring-1 ring-espresso/[0.06]">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-espresso-500">
          <Wheat className="size-3.5" /> 14 major allergens
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {ALLERGENS.map((a) => (
            <span
              key={a.id}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                highlighted.has(a.id) ? "bg-terracotta/12 font-semibold text-terracotta-ink" : "text-espresso-500",
              )}
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsVignette() {
  const top = [
    { name: "Burrata", v: 92 },
    { name: "Pappardelle", v: 74 },
    { name: "Branzino", v: 51 },
  ];
  return (
    <div aria-hidden className="rounded-[20px] bg-white/75 p-4 ring-1 ring-espresso/[0.06]">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11.5px] font-semibold text-espresso-500">Menu views · 30 days</p>
          <p className="mt-0.5 font-display text-[26px] font-medium leading-none tracking-[-0.03em] text-espresso">4,906</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-bold text-mint-ink">
          <TrendingUp className="size-3" /> 21%
        </span>
      </div>
      <svg viewBox="0 0 220 60" className="mt-3 h-14 w-full" fill="none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="feat-spark" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#B9A7F8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#B9A7F8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 48 C15 46 22 38 36 40 S60 30 74 33 S98 20 112 26 S140 14 154 18 S184 6 200 9 S214 4 220 3 L220 60 L0 60 Z" fill="url(#feat-spark)" />
        <path d="M0 48 C15 46 22 38 36 40 S60 30 74 33 S98 20 112 26 S140 14 154 18 S184 6 200 9 S214 4 220 3" stroke="#5B45C4" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <ul className="mt-3 space-y-1.5">
        {top.map((t) => (
          <li key={t.name} className="flex items-center gap-2 text-[12px]">
            <span className="w-20 shrink-0 font-medium text-espresso-600">{t.name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-espresso/[0.06]">
              <span className="block h-full rounded-full bg-[linear-gradient(90deg,#B9A7F8,#5B45C4)]" style={{ width: `${t.v}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MultiMenuVignette() {
  const menus = [
    { name: "Dinner", meta: "11 items", live: true },
    { name: "Drinks", meta: "8 items", live: true },
    { name: "Weekend Brunch", meta: "6 items", live: false },
  ];
  return (
    <div aria-hidden className="relative pt-3">
      <div className="absolute inset-x-6 top-0 h-6 rounded-t-2xl bg-white/50 ring-1 ring-espresso/[0.05]" />
      <div className="absolute inset-x-3 top-1.5 h-6 rounded-t-2xl bg-white/70 ring-1 ring-espresso/[0.05]" />
      <ul className="relative divide-y divide-espresso/[0.06] rounded-[20px] bg-white p-1.5 shadow-[var(--shadow-soft)] ring-1 ring-espresso/[0.06]">
        {menus.map((m) => (
          <li key={m.name} className="flex items-center gap-3 px-2.5 py-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-champagne-soft font-display text-[14px] font-semibold text-[#8a5a17]">
              {m.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-espresso">{m.name}</span>
              <span className="block text-[11.5px] text-espresso-500">{m.meta}</span>
            </span>
            <span
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold",
                m.live ? "bg-mint-soft text-mint-ink" : "bg-espresso/[0.06] text-espresso-600",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {m.live ? "Published" : "Draft"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublishVignette() {
  return (
    <div aria-hidden className="relative flex flex-col items-start gap-3 sm:items-end">
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-2 pl-4 ring-1 ring-white/10">
        <span className="flex items-center gap-2 text-[13px] text-ivory/80">
          <span className="size-2 rounded-full bg-champagne" /> 3 unpublished changes
        </span>
        <span className="btn-3d inline-flex h-9 items-center gap-1.5 rounded-xl bg-[linear-gradient(180deg,#F08A5A_0%,#E97542_45%,#D4612F_100%)] px-4 text-[13px] font-semibold text-white">
          <Rocket className="size-4" /> Publish
        </span>
      </div>
      <div className="flex w-full max-w-[340px] items-center gap-3 rounded-2xl bg-ivory p-3 text-espresso shadow-[0_20px_40px_-16px_rgb(0_0_0/0.5)]">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-soft text-mint-ink">
          <CircleCheck className="size-5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[13.5px] font-semibold">Dinner is live</span>
          <span className="block truncate text-[12px] text-espresso-500">Every QR code now shows the new menu</span>
        </span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="relative scroll-mt-24 py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[20%] h-[520px] w-[520px] rounded-full bg-peach/40 blur-[120px]" />
        <div className="absolute right-[-8%] top-[45%] h-[460px] w-[460px] rounded-full bg-lavender-soft/70 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionHeading
            id="features-title"
            eyebrow="Features"
            title={
              <>
                Everything your menu needs. <Accent>Nothing it doesn&apos;t.</Accent>
              </>
            }
          />
          <Reveal delay={0.08}>
            <p className="text-[17px] leading-relaxed text-espresso-600 lg:pb-2">
              A calm, precise studio for building menus — so you can spend less time in spreadsheets and more time on the pass.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12">
          <Reveal as="li" className="sm:col-span-2 lg:col-span-7">
            <GlassCard interactive padding="lg" className="grid h-full gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <CardText icon={<GripVertical />} title="Drag-and-drop builder">
                Add categories and dishes, then reorder anything with a simple drag. Photos, prices,
                descriptions and availability all live in one place.
              </CardText>
              <BuilderVignette />
            </GlassCard>
          </Reveal>
          <Reveal as="li" delay={0.06} className="sm:col-span-2 md:col-span-1 lg:col-span-5">
            <GlassCard interactive padding="lg" className="flex h-full flex-col justify-between gap-8">
              <CardText icon={<Smartphone />} title="Live preview">
                See exactly what guests see while you type. The preview uses the same renderer as your published menu.
              </CardText>
              <LivePreviewVignette />
            </GlassCard>
          </Reveal>
          <Reveal as="li" className="md:col-span-1 lg:col-span-4">
            <GlassCard interactive padding="lg" className="flex h-full flex-col gap-7">
              <CardText icon={<Leaf />} title="Dietary & allergen labels">
                Tag dishes as vegan, gluten-free or spicy and list the 14 major allergens, so guests can choose with confidence.
              </CardText>
              <DietaryVignette />
            </GlassCard>
          </Reveal>
          <Reveal as="li" delay={0.06} className="lg:col-span-4">
            <GlassCard interactive padding="lg" className="flex h-full flex-col gap-7">
              <CardText icon={<Eye />} title="Privacy-friendly analytics">
                Menu views, QR scans and your most-opened dishes — without cookies or tracking your guests.
              </CardText>
              <AnalyticsVignette />
            </GlassCard>
          </Reveal>
          <Reveal as="li" delay={0.12} className="sm:col-span-2 md:col-span-1 lg:col-span-4">
            <GlassCard interactive padding="lg" className="flex h-full flex-col gap-7">
              <CardText icon={<Layers />} title="Multiple menus">
                Dinner, drinks, brunch, a seasonal tasting menu — keep drafts private and publish each one when it&apos;s ready.
              </CardText>
              <MultiMenuVignette />
            </GlassCard>
          </Reveal>
          <Reveal as="li" className="sm:col-span-2 lg:col-span-12">
            <GlassCard
              tone="dark"
              interactive
              padding="lg"
              className="relative grid gap-8 overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#2E231E_0%,#241B18_55%,#3a2219_100%)] md:grid-cols-2 md:items-center sm:p-10"
            >
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-terracotta/30 blur-[90px]" />
              <div className="relative">
                <CardText dark icon={<Rocket />} title="Instant publish">
                  Fix a typo, mark the special as sold out, change a price — then publish. Every QR code already on your tables
                  shows the update straight away.
                </CardText>
              </div>
              <PublishVignette />
            </GlassCard>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
