"use client";

import { Eye } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { GlassButton } from "@/components/glass/glass-button";
import type { TemplateId } from "@/lib/domain";

export const PREVIEW_TEMPLATE_EVENT = "menumint:preview-template";
export const DEMO_SECTION_ID = "demo";

export function previewTemplate(id: TemplateId, smooth = true) {
  window.dispatchEvent(new CustomEvent<TemplateId>(PREVIEW_TEMPLATE_EVENT, { detail: id }));
  const section = document.getElementById(DEMO_SECTION_ID);
  section?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  document.getElementById(`${DEMO_SECTION_ID}-title`)?.focus({ preventScroll: true });
}

export function TemplatePreviewButton({ id, name }: { id: TemplateId; name: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <GlassButton variant="glass" size="sm" pill onClick={() => previewTemplate(id, !reduceMotion)} aria-label={`Preview the ${name} template`}>
      <Eye aria-hidden /> Preview
    </GlassButton>
  );
}
