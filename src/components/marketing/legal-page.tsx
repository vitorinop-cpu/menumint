import { Eyebrow } from "./section-heading";

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="relative isolate px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute left-[10%] top-[-30%] h-[420px] w-[520px] rounded-full bg-peach/50 blur-[110px]" />
        <div className="absolute right-[8%] top-[-20%] h-[360px] w-[420px] rounded-full bg-lavender-soft blur-[110px]" />
      </div>
      <div className="mx-auto max-w-[760px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.25rem)] font-medium leading-[1] tracking-[-0.04em] text-espresso">{title}</h1>
        <p className="mt-4 text-[14px] text-espresso-500">Last updated {updated}</p>
        <div className="mt-8 text-[18px] leading-relaxed text-espresso-600">{intro}</div>
        <div
          className={[
            "mt-12 space-y-10 text-[16px] leading-[1.75] text-espresso-600",
            "[&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-medium [&_h2]:tracking-[-0.025em] [&_h2]:text-espresso",
            "[&_h3]:mt-6 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-espresso",
            "[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-terracotta",
            "[&_a]:font-medium [&_a]:text-terracotta-ink [&_a]:underline [&_a]:underline-offset-4",
            "[&_strong]:font-semibold [&_strong]:text-espresso",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </article>
  );
}
