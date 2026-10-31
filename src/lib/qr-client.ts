"use client";

import jsQR from "jsqr";
import { buildQrSvg, type QrRenderOptions } from "./qr";

/** Fetches a same-origin/public image and returns it as a data URL (needed inside exported SVG/PNG). */
export async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function svgToCanvas(svg: string, width: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render QR image"));
      img.src = url;
    });
    const ratio = img.naturalHeight / img.naturalWidth || 1;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function downloadQrPng(opts: QrRenderOptions, filename: string, width = 2048) {
  const canvas = await svgToCanvas(buildQrSvg({ ...opts, size: 1024 }), width);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  download(blob, filename);
}

export function downloadQrSvg(opts: QrRenderOptions, filename: string) {
  download(new Blob([buildQrSvg({ ...opts, size: 1024 })], { type: "image/svg+xml" }), filename);
}

/**
 * Renders the QR exactly as exported and decodes it with jsQR to prove it scans.
 * Returns true only if the decoded payload matches the expected URL.
 */
export async function verifyQrScans(opts: QrRenderOptions): Promise<boolean> {
  try {
    const canvas = await svgToCanvas(buildQrSvg({ ...opts, frame: false, size: 600 }), 600);
    const ctx = canvas.getContext("2d")!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
    return result?.data === opts.text;
  } catch {
    return false;
  }
}
