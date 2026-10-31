import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { Reveal } from "./reveal";
import { Eyebrow } from "./section-heading";

const PLATES = [
  { src: "/images/dishes/burrata.jpg", className: "right-[30%] top-[-12%] size-40 [--float-rotate:-6deg]" },
  { src: "/images/dishes/spritz.jpg", className: "right-[6%] top-[14%] size-32 [--float-rotate:8deg] [animation-delay:-2s]" },
  { src: "/images/dishes/tiramisu.jpg", className: "right-[22%] bottom-[-14%] size-36 [--float-rotate:4deg] [animation-delay:-4s]" },
];

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-3 pb-6 pt-10 sm:px-5">
      <Reveal className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[40px] bg-[linear-gradient(125deg,#2E231E_0%,#241B18_45%,#4a2a1c_100%)] px-6 py-20 shadow-[0_40px_100px_-40px_rgb(36_27_24/0.7)] sm:px-14 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-[-30%] h-[420px] w-[420px] rounded-full bg-terracotta/40 blur-[110px]" />
          <div className="absolute bottom-[-40%] right-[20%] h-[420px] w-[520px] rounded-full bg-lavender/25 blur-[120px]" />
          <div className="paper-grain absolute inset-0 opacity-60" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          {PLATES.map((p) => (
            <div
              key={p.src}
              className={`absolute animate-float overflow-hidden rounded-full shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-4 ring-white/10 ${p.className}`}
            >
              <Image src={p.src} alt="" fill sizes="160px" className="object-cover" />
            </div>
          ))}
        </div>

        <div className="relative max-w-[620px]">
          <Eyebrow tone="light">Get started</Eyebrow>
          <h2 id="cta-title" className="mt-5 font-display text-[clamp(2.4rem,5.4vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.04em] text-ivory text-balance">
            Your next menu could be live <em className="font-display italic text-peach [font-variation-settings:'SOFT'_100]">before dinner service.</em>
          </h2>
          <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-ivory/80">
            Pick a template, add your dishes, print your QR code. Free to start, no credit card needed.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <GlassButton asChild size="lg" pill className="px-7">
              <Link href="/signup">
                Get started — it&apos;s free <ArrowRight aria-hidden />
              </Link>
            </GlassButton>
            <GlassButton
              asChild
              variant="ghost"
              size="lg"
              pill
              className="border border-white/20 bg-white/[0.06] text-ivory hover:bg-white/[0.12] hover:text-white"
            >
              <Link href="/m/saffron-sage">See the live demo</Link>
            </GlassButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
