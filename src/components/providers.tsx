"use client";

import { MotionConfig } from "motion/react";
import { GlassTooltipProvider } from "@/components/glass/glass-tooltip";
import { GlassToaster } from "@/components/glass/glass-notification";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <GlassTooltipProvider delayDuration={250}>
        {children}
        <GlassToaster />
      </GlassTooltipProvider>
    </MotionConfig>
  );
}
