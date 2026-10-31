import QRCode from "qrcode";
import type { QrStyle } from "./domain";
import { contrastRatio, luminance } from "./utils";

export interface QrRenderOptions {
  text: string;
  style: QrStyle;
  /** Data URL of a logo to place in the centre (must be inlined for PNG export). */
  logoHref?: string | null;
  /** Adds a printable card frame with the label underneath. */
  frame?: boolean;
  /** Pixel size of the QR square (excluding frame). */
  size?: number;
}

const QUIET = 4;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

function finder(x: number, y: number, style: QrStyle) {
  const { fg, bg, cornerStyle } = style;
  if (cornerStyle === "circle") {
    return `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="3.5" fill="${fg}"/><circle cx="${x + 3.5}" cy="${y + 3.5}" r="2.5" fill="${bg}"/><circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.5" fill="${fg}"/>`;
  }
  const r1 = cornerStyle === "rounded" ? 2 : 0;
  const r2 = cornerStyle === "rounded" ? 1.4 : 0;
  const r3 = cornerStyle === "rounded" ? 0.9 : 0;
  return `<rect x="${x}" y="${y}" width="7" height="7" rx="${r1}" fill="${fg}"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="${r2}" fill="${bg}"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="${r3}" fill="${fg}"/>`;
}

/** Builds a styled QR code as an SVG string (works on server and client). */
export function buildQrSvg({ text, style, logoHref, frame = false, size = 512 }: QrRenderOptions) {
  const withLogo = Boolean(style.logo && logoHref);
  const qr = QRCode.create(text, { errorCorrectionLevel: withLogo ? "H" : "Q" });
  const n = qr.modules.size;
  const total = n + QUIET * 2;
  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // Reserve a centred square for the logo (≈22% of the code; safe with level H).
  const logoModules = withLogo ? Math.floor(n * 0.22) | 1 : 0;
  const logoStart = Math.floor((n - logoModules) / 2);
  const inLogo = (r: number, c: number) =>
    withLogo && r >= logoStart - 1 && r < logoStart + logoModules + 1 && c >= logoStart - 1 && c < logoStart + logoModules + 1;

  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
      const x = c + QUIET;
      const y = r + QUIET;
      if (style.dotStyle === "dots") parts.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.43"/>`);
      else if (style.dotStyle === "rounded") parts.push(`<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.32"/>`);
      else parts.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`);
    }
  }

  const finders = [finder(QUIET, QUIET, style), finder(QUIET + n - 7, QUIET, style), finder(QUIET, QUIET + n - 7, style)].join("");
  let logo = "";
  if (withLogo && logoHref) {
    const s = logoModules;
    const p = QUIET + logoStart;
    logo = `<rect x="${p - 0.6}" y="${p - 0.6}" width="${s + 1.2}" height="${s + 1.2}" rx="${s * 0.22}" fill="${style.bg}"/><image href="${escapeXml(logoHref)}" x="${p}" y="${p}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round ${s * 0.18}px)"/>`;
  }

  const codeGroup = `<rect width="${total}" height="${total}" fill="${style.bg}"/><g fill="${style.fg}"${style.dotStyle === "square" ? ' shape-rendering="crispEdges"' : ""}>${parts.join("")}</g>${finders}${logo}`;

  if (!frame) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}">${codeGroup}</svg>`;
  }
  const label = style.frameLabel.trim() || "Scan for menu";
  const pad = 3;
  const labelH = 9;
  const w = total + pad * 2;
  const h = total + pad * 2 + labelH;
  const px = Math.round((size / total) * w);
  const py = Math.round((size / total) * h);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${py}"><rect width="${w}" height="${h}" rx="4" fill="${style.fg}"/><rect x="${pad - 1}" y="${pad - 1}" width="${total + 2}" height="${total + 2}" rx="2.5" fill="${style.bg}"/><g transform="translate(${pad} ${pad})">${codeGroup}</g><text x="${w / 2}" y="${total + pad * 2 + labelH / 2 + 0.6}" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="4.2" letter-spacing="0.3" fill="${style.bg}">${escapeXml(label.toUpperCase())}</text></svg>`;
}

export interface QrReadability {
  ok: boolean;
  contrast: number;
  issues: string[];
}

/** Static readability checks (contrast, polarity, logo coverage). */
export function checkQrReadability(style: QrStyle): QrReadability {
  const contrast = contrastRatio(style.fg, style.bg);
  const issues: string[] = [];
  if (contrast < 4) issues.push(`Contrast is ${contrast.toFixed(1)}:1 — use at least 4:1 for reliable scanning.`);
  if (luminance(style.fg) > luminance(style.bg)) issues.push("Foreground should be darker than the background.");
  return { ok: issues.length === 0, contrast, issues };
}
