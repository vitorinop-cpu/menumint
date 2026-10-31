import Image from "next/image";
import { Contrast, Download, Link2, Printer, ScanLine, ShieldCheck } from "lucide-react";
import type { QrStyle } from "@/lib/domain";
import { buildQrSvg } from "@/lib/qr";
import { contrastRatio } from "@/lib/utils";
import { getRequestOrigin } from "@/lib/origin";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";

const QR_STYLE: QrStyle = {
  fg: "#241B18",
  bg: "#FFFFFF",
  dotStyle: "rounded",
  cornerStyle: "rounded",
  logo: false,
  frameLabel: "",
};

// Where the blank card sits inside /images/hero/qr-stand.jpg (percent of the image).
const CARD = { left: 32.6, top: 24.1, width: 67.3 - 32.6, height: 67.7 - 24.1 };

const POINTS = [
  {
    icon: Link2,
    title: "Print once, update forever",
    body: "Every code points to a stable short link. Change dishes, prices or the whole menu — the code on your tables never needs reprinting.",
  },
  {
    icon: Download,
    title: "PNG & SVG downloads",
    body: "High-resolution PNG for quick jobs and crisp vector SVG for your designer or print shop.",
  },
  {
    icon: Printer,
    title: "Print-ready frames",
    body: "Add a “Scan for menu” frame, your colours and your logo, ready for table tents, windows and receipts.",
  },
  {
    icon: ScanLine,
    title: "Scan analytics",
    body: "See how many guests scan each code, without cookies and without storing anything that identifies them.",
  },
  {
    icon: Contrast,
    title: "Contrast validation",
    body: "MenuMint checks colour contrast as you style a code and warns you before you print something phones can’t read.",
  },
];

export async function QrSection() {
  const origin = await getRequestOrigin();
  const url = `${origin}/q/sgtable1`;
  const svg = buildQrSvg({ text: url, style: QR_STYLE, size: 512 });
  const ratio = contrastRatio(QR_STYLE.fg, QR_STYLE.bg);

  return (
    <section id="qr" aria-labelledby="qr-title" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <Reveal as="figure" className="relative">
          <div className="relative aspect-[1448/1086] overflow-hidden rounded-[32px] shadow-[0_2px_4px_rgb(36_27_24/0.06),0_40px_80px_-36px_rgb(120_60_30/0.5)] ring-1 ring-espresso/[0.06]">
            <Image
              src="/images/hero/qr-stand.jpg"
              alt="A table card on a wooden stand in a sunlit café, printed with a MenuMint QR code"
              fill
              sizes="(min-width: 1024px) 680px, 100vw"
              className="object-cover"
            />
            {/* The real, scannable QR code printed onto the blank card */}
            <div
              className="@container absolute mix-blend-multiply"
              style={{ left: `${CARD.left}%`, top: `${CARD.top}%`, width: `${CARD.width}%`, height: `${CARD.height}%` }}
            >
              <div className="absolute inset-0 flex flex-col items-center px-[8%] pb-[6.5%] pt-[6%]">
                <div
                  className="min-h-0 w-full flex-1 [&>svg]:block [&>svg]:size-full"
                  role="img"
                  aria-label={`QR code linking to ${url}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <p className="mt-[2.5cqw] whitespace-nowrap font-display text-[6cqw] font-semibold leading-none tracking-[-0.01em] text-espresso">
                  Saffron &amp; Sage
                </p>
                <p className="mt-[2cqw] whitespace-nowrap text-[3.6cqw] font-semibold uppercase leading-none tracking-[0.2em] text-espresso-600">
                  Scan for the menu
                </p>
              </div>
            </div>

            <div
              aria-hidden
              className="glass absolute left-3 top-3 flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 sm:left-5 sm:top-5"
            >
              <span className="grid size-7 place-items-center rounded-full bg-espresso text-ivory">
                <Link2 className="size-3.5" />
              </span>
              <span className="font-mono text-[12px] font-medium text-espresso">/q/sgtable1</span>
            </div>
            <div
              aria-hidden
              className="glass absolute bottom-3 right-3 hidden items-center gap-2.5 rounded-2xl py-2 pl-2 pr-4 sm:bottom-5 sm:right-5 sm:flex"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-mint-soft text-mint-ink">
                <ShieldCheck className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[12.5px] font-semibold text-espresso">Scan-ready</span>
                <span className="block text-[11.5px] text-espresso-600">Contrast {ratio.toFixed(1)}:1</span>
              </span>
            </div>
          </div>
          <figcaption className="mt-4 text-center text-[13px] text-espresso-500 lg:text-left">
            A real, scannable code generated by MenuMint — styled with rounded modules in espresso ink.
          </figcaption>
        </Reveal>

        <div>
          <SectionHeading
            id="qr-title"
            eyebrow="QR codes"
            title={
              <>
                One small square. <Accent>Your whole menu.</Accent>
              </>
            }
            lede="Guests point their camera and your menu opens instantly — no app, no download, no login."
          />
          <ul className="mt-10 space-y-6">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.05} className="flex gap-4">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-terracotta-ink shadow-[var(--shadow-soft)] ring-1 ring-espresso/[0.06]">
                  <p.icon className="size-[18px]" />
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-espresso">{p.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-espresso-600">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
