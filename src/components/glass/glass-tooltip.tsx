"use client";

import * as React from "react";
import { Tooltip } from "radix-ui";
import { cn } from "@/lib/utils";

export const GlassTooltipProvider = Tooltip.Provider;

export function GlassTooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip.Root delayDuration={250}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={8}
          className={cn(
            "glass-dark z-[60] max-w-xs rounded-xl px-2.5 py-1.5 text-xs font-medium leading-snug",
            "data-[state=delayed-open]:animate-[dropdown-in_180ms_var(--ease-spring)]",
            className,
          )}
        >
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
