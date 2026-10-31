"use client";

import * as React from "react";
import { Tabs } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface GlassTabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

/** Tabs with a spring-animated liquid indicator. */
export function GlassTabs({
  items,
  value,
  onValueChange,
  children,
  className,
  listClassName,
  id,
}: {
  items: GlassTabItem[];
  value: string;
  onValueChange: (v: string) => void;
  children?: React.ReactNode;
  className?: string;
  listClassName?: string;
  id: string;
}) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className={className}>
      <Tabs.List
        className={cn("glass-subtle inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1 no-scrollbar", listClassName)}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            className="relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-espresso-500 outline-none transition-colors hover:text-espresso data-[state=active]:text-espresso focus-visible:ring-2 focus-visible:ring-terracotta/50"
          >
            {value === item.value && (
              <motion.span
                layoutId={`${id}-indicator`}
                className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_2px_rgb(36_27_24/0.08),0_4px_12px_-4px_rgb(36_27_24/0.12),inset_0_1px_0_white]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 [&_svg]:size-4">
              {item.icon}
              {item.label}
            </span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}

export const GlassTabsContent = Tabs.Content;

/** Lightweight segmented control (radio-group semantics) for compact option pickers. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  id,
  disabled,
  size = "md",
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  id: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn("inline-flex w-full gap-1 rounded-xl bg-espresso/[0.05] p-1", disabled && "opacity-55")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-lg px-2 font-medium text-espresso-500 transition-colors hover:text-espresso disabled:cursor-not-allowed",
              size === "sm" ? "h-7 text-xs" : "h-8 text-[13px]",
              active && "text-espresso",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-seg`}
                className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_2px_rgb(36_27_24/0.1),0_2px_8px_-2px_rgb(36_27_24/0.1)]"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
