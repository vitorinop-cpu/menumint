import Image from "next/image";
import { FONT_OPTIONS, TEMPLATES, fontFamily } from "@/lib/templates";
import { PLANS, minimumPlanForTemplate } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Accent, SectionHeading } from "./section-heading";
import { TemplatePreviewButton } from "./template-preview-button";

const fontLabel = (id: string) => FONT_OPTIONS.find((f) => f.id === id)?.label ?? id;

export function TemplateGallery() {
  return (
    <section id="templates" aria-labelledby="templates-title" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SectionHeading
            id="templates-title"
            eyebrow="Templates"
            title={
              <>
                Six looks, each with <Accent>a point of view.</Accent>
              </>
            }
          />
          <Reveal delay={0.08}>
            <p className="text-[17px] leading-relaxed text-espresso-600 lg:pb-2">
              Start from a template designed around a kind of place — then make every colour, font and corner your own.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:pb-12">
          {TEMPLATES.map((t, i) => {
            const plan = PLANS[minimumPlanForTemplate(t.id)];
            const b = t.branding;
            return (
              <Reveal as="li" key={t.id} delay={(i % 3) * 0.06} className={cn(i % 3 === 1 && "lg:translate-y-12")}>
                <article
                  aria-labelledby={`tpl-${t.id}`}
                  className="group h-full rounded-[32px] bg-white/60 p-2.5 ring-1 ring-espresso/[0.06] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="relative aspect-[16/11] overflow-hidden rounded-[24px]">
                    <Image
                      src={t.cover}
                      alt={`${t.name} template cover photo`}
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
                    />
                    <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(20_12_8/0.35))]" />
                    <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-espresso">
                      {plan.priceMonthly === 0 ? "Included free" : `${plan.name} plan`}
                    </span>
                    <div className="absolute bottom-3 right-3">
                      <TemplatePreviewButton id={t.id} name={t.name} />
                    </div>
                  </div>
                  <div className="px-3 pb-3 pt-5">
                    <h3
                      id={`tpl-${t.id}`}
                      className={cn("text-[24px] leading-tight tracking-[-0.01em] text-espresso", b.headingFont === "archivo-black" && "text-[21px] uppercase")}
                      style={{ fontFamily: fontFamily(b.headingFont), fontWeight: b.headingFont === "archivo-black" ? 400 : 600 }}
                    >
                      {t.name}
                    </h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-espresso-600">{t.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-espresso/[0.07] pt-4">
                      <ul className="flex -space-x-1.5" aria-label="Colour palette">
                        {[b.primaryColor, b.secondaryColor, b.backgroundColor].map((c) => (
                          <li
                            key={c}
                            className="size-6 rounded-full ring-2 ring-white shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
                            style={{ background: c }}
                          >
                            <span className="sr-only">{c}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="truncate text-[12.5px] text-espresso-500">
                        <span style={{ fontFamily: fontFamily(b.headingFont) }} className="text-[15px] text-espresso">
                          Aa
                        </span>{" "}
                        {fontLabel(b.headingFont)}
                        {b.bodyFont !== b.headingFont && ` + ${fontLabel(b.bodyFont)}`}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
