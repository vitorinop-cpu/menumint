"use client";

import { Printer } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";

export function PrintButton() {
  return (
    <GlassButton size="sm" onClick={() => window.print()}>
      <Printer /> Print
    </GlassButton>
  );
}
