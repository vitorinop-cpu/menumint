import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-strong rounded-[28px] p-7 sm:p-8", className)}>
      <h1 className="font-display text-[32px] font-medium leading-[1.05] tracking-[-0.025em] text-espresso">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-espresso-500">{subtitle}</p>}
      <div className="mt-7">{children}</div>
      {footer && <div className="mt-6 border-t border-espresso/[0.07] pt-5 text-center text-sm text-espresso-500">{footer}</div>}
    </div>
  );
}
