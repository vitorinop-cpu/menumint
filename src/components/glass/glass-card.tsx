import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("relative rounded-[22px]", {
  variants: {
    tone: {
      default: "glass glass-rim",
      strong: "glass-strong",
      subtle: "glass-subtle",
      dark: "glass-dark",
      solid: "bg-white border border-espresso/[0.07] shadow-[var(--shadow-soft)]",
    },
    interactive: {
      true: "transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
    },
    padding: { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" },
  },
  defaultVariants: { tone: "default", padding: "md" },
});

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: "div" | "section" | "article" | "aside";
}

export function GlassCard({ className, tone, interactive, padding, as: Tag = "div", ...props }: GlassCardProps) {
  return <Tag className={cn(cardVariants({ tone, interactive, padding }), className)} {...props} />;
}

export function GlassCardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-espresso">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-espresso-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
