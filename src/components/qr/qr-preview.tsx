"use client";

import * as React from "react";
import { buildQrSvg } from "@/lib/qr";
import type { QrStyle } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Renders a real, scannable QR code (SVG) for the given URL and style. */
export function QrPreview({
  text,
  style,
  logoHref,
  frame,
  className,
  label,
}: {
  text: string;
  style: QrStyle;
  logoHref?: string | null;
  frame?: boolean;
  className?: string;
  label: string;
}) {
  const svg = React.useMemo(() => {
    if (!text) return "";
    return buildQrSvg({ text, style, logoHref, frame, size: 512 }).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
  }, [text, style, logoHref, frame]);
  return <div role="img" aria-label={label} className={cn("[&>svg]:block", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
