"use client";

import * as React from "react";
import { Switch as RSwitch } from "radix-ui";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlassSwitch({
  checked,
  onCheckedChange,
  id,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative shrink-0 rounded-full bg-espresso/15 shadow-[inset_0_1px_2px_rgb(36_27_24/0.15)] outline-none transition-colors duration-300 data-[state=checked]:bg-[linear-gradient(180deg,#8FD6B2,#5FBF8F)] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-terracotta/60 focus-visible:ring-offset-2",
        size === "md" ? "h-[26px] w-[44px]" : "h-[20px] w-[34px]",
      )}
    >
      <RSwitch.Thumb
        className={cn(
          "block rounded-full bg-white shadow-[0_1px_2px_rgb(36_27_24/0.2),0_3px_8px_rgb(36_27_24/0.15)] transition-transform duration-[400ms] ease-[var(--ease-spring)]",
          size === "md"
            ? "size-[22px] translate-x-[2px] data-[state=checked]:translate-x-[20px]"
            : "size-[16px] translate-x-[2px] data-[state=checked]:translate-x-[16px]",
        )}
      />
    </RSwitch.Root>
  );
}

const badgeTones = {
  neutral: "bg-espresso/[0.06] text-espresso-600",
  terracotta: "bg-terracotta/12 text-terracotta-ink",
  mint: "bg-mint-soft text-mint-ink",
  lavender: "bg-lavender-soft text-lavender-ink",
  champagne: "bg-champagne-soft text-[#8a5a17]",
  dark: "bg-espresso text-ivory",
  danger: "bg-danger/10 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold leading-none",
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function PlanLock({ plan, className }: { plan: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full bg-lavender-soft px-2 text-[10.5px] font-bold uppercase tracking-wide text-lavender-ink",
        className,
      )}
    >
      <Lock className="size-2.5" aria-hidden />
      {plan}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Toggle chip used for dietary/allergen pickers. */
export function ToggleChip({
  pressed,
  onPressedChange,
  children,
  tone = "mint",
}: {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  children: React.ReactNode;
  tone?: "mint" | "terracotta";
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "h-8 rounded-full border px-3 text-[13px] font-medium transition-[background,border,color,transform] duration-200 active:scale-95",
        pressed
          ? tone === "mint"
            ? "border-mint-ink/30 bg-mint-soft text-mint-ink"
            : "border-terracotta/40 bg-terracotta/10 text-terracotta-ink"
          : "border-espresso/12 bg-white/70 text-espresso-500 hover:border-espresso/25 hover:text-espresso",
      )}
    >
      {children}
    </button>
  );
}

export function ColorField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = React.useState(value);
  const [prev, setPrev] = React.useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  return (
    <div className={cn(disabled && "opacity-55")}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-espresso-600">
        {label}
      </label>
      <div className="flex h-11 items-center gap-2 rounded-[13px] border border-espresso/12 bg-white/85 pl-1.5 pr-3 focus-within:border-terracotta/70 focus-within:shadow-[0_0_0_4px_rgb(233_117_66/0.14)]">
        <span className="relative size-8 shrink-0 overflow-hidden rounded-[9px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]">
          <input
            type="color"
            aria-label={`${label} picker`}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute -inset-2 size-12 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
          />
        </span>
        <input
          id={id}
          value={draft}
          disabled={disabled}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setDraft(v);
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase());
          }}
          onBlur={() => setDraft(value)}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-espresso outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
