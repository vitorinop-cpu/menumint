import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Eyebrow({ children, className, tone = "terracotta" }: { children: React.ReactNode; className?: string; tone?: "terracotta" | "light" }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.22em]",
        tone === "light" ? "text-peach" : "text-terracotta-ink",
        className,
      )}
    >
      <span aria-hidden className="h-px w-6 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  tone = "default",
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "default" | "light";
}) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <Eyebrow tone={tone === "light" ? "light" : "terracotta"}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        tabIndex={-1}
        className={cn(
          "mt-4 font-display text-[clamp(2.25rem,4.6vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-balance outline-none",
          tone === "light" ? "text-ivory" : "text-espresso",
        )}
      >
        {title}
      </h2>
      {lede && (
        <p className={cn("mt-5 text-[17px] leading-relaxed text-pretty", tone === "light" ? "text-ivory/80" : "text-espresso-600")}>{lede}</p>
      )}
    </Reveal>
  );
}

/** Italic terracotta accent used inside display headlines. */
export function Accent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <em
      className={cn(
        "bg-[linear-gradient(100deg,#A9441B_0%,#D4612F_45%,#C8572B_70%,#B5743A_100%)] bg-clip-text pr-[0.06em] font-display italic text-transparent [font-variation-settings:'SOFT'_100]",
        className,
      )}
    >
      {children}
    </em>
  );
}
