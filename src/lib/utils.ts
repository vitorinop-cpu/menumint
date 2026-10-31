import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ZERO_DECIMAL = new Set(["JPY"]);

export function minorUnitFactor(currency: string) {
  return ZERO_DECIMAL.has(currency) ? 1 : 100;
}

export function formatPrice(minor: number, currency: string, locale = "en-US") {
  const factor = minorUnitFactor(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: factor === 1 ? 0 : minor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: factor === 1 ? 0 : 2,
    }).format(minor / factor);
  } catch {
    return `${(minor / factor).toFixed(2)} ${currency}`;
  }
}

/** Parses a user-entered price ("12.5", "12,50", "$12") into minor units. */
export function parsePrice(input: string, currency: string): number | null {
  const cleaned = input.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null;
  return Math.round(value * minorUnitFactor(currency));
}

export function priceToInput(minor: number, currency: string) {
  const factor = minorUnitFactor(currency);
  return factor === 1 ? String(minor) : (minor / factor).toFixed(2);
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function relativeTime(iso: string, now = Date.now()) {
  const diff = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function newId() {
  return crypto.randomUUID();
}

// ── Colour helpers (WCAG contrast) ─────────────────────────
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Readable text colour for a given background. */
export function onColor(bg: string, dark = "#241B18", light = "#FFFFFF") {
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}

export function withAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function mix(hexA: string, hexB: string, t: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
