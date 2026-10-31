import type { BrandingInput } from "./domain";
import { fontFamily } from "./templates";
import { contrastRatio, luminance, mix, onColor, withAlpha } from "./utils";

/** Nudges a colour toward black/white until it reaches the target contrast on `bg`. */
export function ensureContrast(color: string, bg: string, min = 4.5) {
  if (contrastRatio(color, bg) >= min) return color;
  const target = luminance(bg) > 0.4 ? "#000000" : "#FFFFFF";
  for (let t = 0.08; t <= 1; t += 0.08) {
    const c = mix(color, target, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return target;
}

export interface MenuTheme {
  vars: Record<string, string>;
  isDark: boolean;
  buttonRadius: string;
}

export function buildMenuTheme(b: BrandingInput): MenuTheme {
  const bg = b.backgroundColor;
  const isDark = luminance(bg) < 0.22;
  const text = isDark ? "#F7F1EA" : onColor(bg, "#1E1714", "#FFFFFF");
  const muted = isDark ? mix(text, bg, 0.35) : mix(text, bg, 0.38);
  const surface = isDark ? mix(bg, "#FFFFFF", 0.06) : mix(bg, "#FFFFFF", 0.7);
  const border = isDark ? withAlpha("#FFFFFF", 0.1) : withAlpha(text, 0.1);
  const accentInk = ensureContrast(b.primaryColor, isDark ? surface : bg, 4.5);
  const mutedSafe = ensureContrast(muted, bg, 4.6);
  const radius = `${b.radius}px`;
  const buttonRadius = b.buttonStyle === "pill" ? "999px" : b.buttonStyle === "rounded" ? `${Math.max(8, Math.min(b.radius, 16))}px` : "3px";
  let background = bg;
  if (b.background === "gradient") {
    background = isDark
      ? `radial-gradient(120% 60% at 50% 0%, ${mix(bg, b.primaryColor, 0.16)} 0%, ${bg} 60%)`
      : `radial-gradient(120% 70% at 50% 0%, ${mix(bg, b.secondaryColor, 0.25)} 0%, ${bg} 65%)`;
  }
  return {
    isDark,
    buttonRadius,
    vars: {
      "--mm-bg": bg,
      "--mm-background": background,
      "--mm-text": text,
      "--mm-muted": mutedSafe,
      "--mm-surface": surface,
      "--mm-border": border,
      "--mm-primary": b.primaryColor,
      "--mm-on-primary": onColor(b.primaryColor, "#1E1714", "#FFFFFF"),
      "--mm-secondary": b.secondaryColor,
      "--mm-accent-ink": accentInk,
      "--mm-soft": withAlpha(b.primaryColor, isDark ? 0.16 : 0.1),
      "--mm-radius": radius,
      "--mm-btn-radius": buttonRadius,
      "--mm-heading": fontFamily(b.headingFont),
      "--mm-body": fontFamily(b.bodyFont),
    },
  };
}
