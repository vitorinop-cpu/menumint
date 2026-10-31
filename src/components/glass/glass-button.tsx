"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em] outline-none disabled:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.1em]",
  {
    variants: {
      variant: {
        primary:
          "btn-3d text-white bg-[linear-gradient(180deg,#F08A5A_0%,#E97542_45%,#D4612F_100%)] [--btn-glow:233_117_66]",
        dark: "btn-3d text-ivory bg-[linear-gradient(180deg,#4A3A32_0%,#2E231E_55%,#241B18_100%)] [--btn-glow:36_27_24]",
        glass:
          "btn-3d text-espresso bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,242,0.78))] border border-white/80 backdrop-blur-md [--btn-glow:120_70_40] [box-shadow:inset_0_1px_0_white,0_1px_2px_rgb(36_27_24/0.06),0_6px_16px_-6px_rgb(120_70_40/0.22)]",
        mint: "btn-3d text-espresso bg-[linear-gradient(180deg,#C6F0DA_0%,#A9E4C6_55%,#8FD6B2_100%)] [--btn-glow:60_150_110]",
        lavender:
          "btn-3d text-white bg-[linear-gradient(180deg,#9C88F2_0%,#8570E6_55%,#6F58D6_100%)] [--btn-glow:120_95_230]",
        danger: "btn-3d text-white bg-[linear-gradient(180deg,#DA5A44_0%,#C2412D_100%)] [--btn-glow:194_65_45]",
        ghost:
          "text-espresso-600 hover:text-espresso hover:bg-espresso/[0.06] active:bg-espresso/10 transition-[background,color,transform] duration-200 active:scale-[0.97]",
        outline:
          "border border-espresso/15 bg-white/50 text-espresso hover:bg-white/80 hover:border-espresso/25 transition-[background,border,transform] duration-200 active:scale-[0.97]",
        link: "text-terracotta-ink underline-offset-4 hover:underline px-0! h-auto!",
      },
      size: {
        xs: "h-7 rounded-lg px-2.5 text-xs",
        sm: "h-9 rounded-xl px-3.5 text-sm",
        md: "h-11 rounded-[14px] px-5 text-[15px]",
        lg: "h-13 rounded-2xl px-7 text-base",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
      },
      pill: { true: "rounded-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, variant, size, pill, asChild, loading, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, pill }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});
