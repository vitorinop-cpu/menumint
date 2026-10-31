"use client";

import { RotateCcw } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <GlassCard className="mx-auto mt-10 max-w-lg text-center" padding="lg">
      <h1 className="font-display text-2xl font-medium tracking-tight text-espresso">Something went wrong</h1>
      <p className="mt-2 text-sm text-espresso-500">
        We couldn&apos;t load this page. Your saved work is safe.
        {error.digest && <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span>}
      </p>
      <GlassButton className="mt-6" onClick={reset}>
        <RotateCcw /> Try again
      </GlassButton>
    </GlassCard>
  );
}
