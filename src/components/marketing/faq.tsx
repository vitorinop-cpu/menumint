"use client";

import Link from "next/link";
import { Accordion } from "radix-ui";
import { Plus } from "lucide-react";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do my customers need to download an app?",
    a: "No. Guests scan the QR code with their phone camera (or tap a link) and your menu opens in the browser they already have. There's nothing to install and no account to create.",
  },
  {
    q: "Can I change prices or dishes without reprinting my QR codes?",
    a: "Yes. Every QR code points to a stable short link that's resolved at the moment it's scanned. Edit your menu, press publish, and every code already on your tables shows the latest version.",
  },
  {
    q: "How do allergen and dietary labels work?",
    a: "You can tag each dish as vegetarian, vegan, gluten-free, dairy-free, spicy, halal or nut-free, and mark any of the 14 major allergens recognised in EU/UK food labelling. Guests tap a dish to see them. You stay responsible for the accuracy of the information, and your menu reminds guests to tell your team about allergies before ordering.",
  },
  {
    q: "What if a guest has no signal — or I still want printed menus?",
    a: "Opening a digital menu needs an internet connection, but MenuMint pages are lightweight and images are optimised so they load quickly on mobile data. We'd always recommend keeping a few printed menus on hand for guests who prefer paper. Your QR codes download as PNG or SVG with print-ready frames for table tents, windows and receipts.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Paid plans are billed monthly through Stripe and you can cancel from your billing settings whenever you like. You keep your paid features until the end of the period you've paid for, then your account moves to the Free plan.",
  },
  {
    q: "What do you collect about my guests?",
    a: (
      <>
        Very little, on purpose. Menus set no cookies for diners, and we don&apos;t store IP addresses or user agents. For your
        analytics we record only the type of event (a menu view, QR scan or dish opened), which menu or dish it was, a coarse device
        class (mobile, tablet or desktop) and the referring website&apos;s host name. Browsers sending Do Not Track or Global
        Privacy Control aren&apos;t counted at all. Read the full{" "}
        <Link href="/privacy" className="font-medium text-terracotta-ink underline underline-offset-4">
          privacy policy
        </Link>
        .
      </>
    ),
  },
  {
    q: "Is the Free plan really free?",
    a: "Yes — no credit card and no trial clock. The Free plan includes one restaurant, one menu, a classic QR code and two templates. Upgrade only if you need more menus, templates, QR styling or analytics.",
  },
  {
    q: "Can I manage more than one location?",
    a: "Yes — the Business plan supports up to 10 locations, and you can invite team members as editors so the people closest to each kitchen can keep its menu up to date.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title={
              <>
                Good questions, <Accent>straight answers.</Accent>
              </>
            }
            lede="Everything owners usually ask before putting a QR code on the table."
          />
        </div>

        <Reveal delay={0.06}>
          <Accordion.Root type="single" collapsible className="glass-strong divide-y divide-espresso/[0.08] rounded-[28px] px-2 sm:px-3">
            {FAQS.map((f, i) => (
              <Accordion.Item key={f.q} value={`faq-${i}`} className="group/item">
                <Accordion.Header asChild>
                  <h3>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-5 rounded-2xl px-4 py-5 text-left text-[16.5px] font-semibold tracking-[-0.01em] text-espresso outline-none transition-colors hover:text-terracotta-ink focus-visible:ring-2 focus-visible:ring-terracotta/60 sm:px-5 sm:text-[17px]">
                      {f.q}
                      <span
                        aria-hidden
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-espresso/[0.05] text-espresso-600 transition-[transform,background,color] duration-500 ease-[var(--ease-spring)] group-data-[state=open]:rotate-45 group-data-[state=open]:bg-terracotta group-data-[state=open]:text-white"
                      >
                        <Plus className="size-4" />
                      </span>
                    </Accordion.Trigger>
                  </h3>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[mm-accordion-up_260ms_var(--ease-out-soft)] data-[state=open]:animate-[mm-accordion-down_320ms_var(--ease-out-soft)]">
                  <p className="max-w-[62ch] px-4 pb-6 text-[15.5px] leading-relaxed text-espresso-600 sm:px-5">{f.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
      <style href="mm-accordion-keyframes" precedence="default">{`
        @keyframes mm-accordion-down { from { height: 0; opacity: 0 } to { height: var(--radix-accordion-content-height); opacity: 1 } }
        @keyframes mm-accordion-up { from { height: var(--radix-accordion-content-height); opacity: 1 } to { height: 0; opacity: 0 } }
      `}</style>
    </section>
  );
}
