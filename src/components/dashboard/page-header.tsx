import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-terracotta-ink">{eyebrow}</p>}
        <h1 className="font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.03em] text-espresso">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-espresso-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
  accent = "terracotta",
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  icon: React.ReactNode;
  hint?: string;
  accent?: "terracotta" | "lavender" | "mint" | "champagne";
}) {
  const accents = {
    terracotta: "from-[#FFC6A6] to-[#E97542] shadow-[0_6px_14px_-6px_rgb(233_117_66/0.7)]",
    lavender: "from-[#D9CCFF] to-[#8570E6] shadow-[0_6px_14px_-6px_rgb(133_112_230/0.7)]",
    mint: "from-[#C6F0DA] to-[#5FBF8F] shadow-[0_6px_14px_-6px_rgb(95_191_143/0.7)]",
    champagne: "from-[#F6E2C2] to-[#D9A45A] shadow-[0_6px_14px_-6px_rgb(217_164_90/0.7)]",
  };
  return (
    <div className="glass glass-rim group rounded-[22px] p-5 transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-espresso-500">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white [&_svg]:size-[18px]", accents[accent])}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-[34px] font-medium leading-none tracking-[-0.03em] text-espresso tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[12.5px]">
        {typeof delta === "number" && Number.isFinite(delta) && (
          <span className={cn("rounded-full px-1.5 py-0.5 font-semibold", delta >= 0 ? "bg-mint-soft text-mint-ink" : "bg-danger/10 text-danger")}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(Math.round(delta))}%
          </span>
        )}
        {hint && <span className="text-espresso-500">{hint}</span>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="grid size-14 place-items-center rounded-[18px] bg-white text-terracotta shadow-[var(--shadow-soft)] [&_svg]:size-6">{icon}</div>
      <p className="mt-4 font-semibold text-espresso">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-espresso-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function pctDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}
