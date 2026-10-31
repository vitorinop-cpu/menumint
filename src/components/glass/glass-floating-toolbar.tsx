"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { GlassTooltip } from "./glass-tooltip";

export function GlassFloatingToolbar({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <motion.div
      role="toolbar"
      aria-label={label}
      initial={{ y: 24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.1 }}
      className={cn("glass glass-rim flex items-center gap-1 rounded-[20px] p-1.5", className)}
    >
      {children}
    </motion.div>
  );
}

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string; shortcut?: string }
>(function ToolbarButton({ tooltip, shortcut, className, children, ...props }, ref) {
  return (
    <GlassTooltip
      content={
        <span className="flex items-center gap-2">
          {tooltip}
          {shortcut && <kbd className="rounded bg-white/15 px-1 font-sans text-[10px]">{shortcut}</kbd>}
        </span>
      }
    >
      <button
        ref={ref}
        type="button"
        aria-label={tooltip}
        className={cn(
          "grid size-10 place-items-center rounded-[14px] text-espresso-600 transition-[background,color,transform] duration-200 hover:bg-espresso/[0.06] hover:text-espresso active:scale-90 disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[18px]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </GlassTooltip>
  );
});

export function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-6 w-px bg-espresso/10" />;
}
