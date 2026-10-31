"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export async function uploadImage(file: File, restaurantId: string, kind: "logo" | "cover" | "item") {
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Upload a JPG, PNG or WebP image.");
  const body = new FormData();
  body.set("file", file);
  body.set("restaurantId", restaurantId);
  body.set("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json.url;
}

export function ImageUpload({
  value,
  onChange,
  restaurantId,
  kind,
  label,
  aspect = "aspect-[16/9]",
  className,
  hint,
  rounded = "rounded-2xl",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  restaurantId: string;
  kind: "logo" | "cover" | "item";
  label: string;
  aspect?: string;
  className?: string;
  hint?: string;
  rounded?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const id = React.useId();

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file, restaurantId, kind);
      onChange(url);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span id={`${id}-label`} className="text-[13px] font-medium text-espresso-600">
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-espresso-500 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden /> Remove
          </button>
        )}
      </div>
      <button
        type="button"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative grid w-full place-items-center overflow-hidden border-2 border-dashed transition-all duration-300",
          aspect,
          rounded,
          dragging ? "scale-[1.01] border-terracotta bg-terracotta/5" : "border-espresso/15 bg-white/60 hover:border-terracotta/50 hover:bg-white/90",
          value && "border-solid border-transparent",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill sizes="400px" unoptimized={value.startsWith("/api/uploads/")} className="object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-espresso/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-espresso/40 group-hover:opacity-100 group-focus-visible:bg-espresso/40 group-focus-visible:opacity-100">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="size-4" aria-hidden /> Replace
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 p-3 text-center text-espresso-500">
            <span className="grid size-10 place-items-center rounded-xl bg-white shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:scale-105">
              <ImagePlus className="size-5 text-terracotta" aria-hidden />
            </span>
            <span className="text-[13px] font-medium text-espresso">Drop an image or browse</span>
            <span className="text-[11.5px]">JPG, PNG or WebP · max 5 MB</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm" role="status">
            <Loader2 className="size-6 animate-spin text-terracotta" aria-hidden />
            <span className="sr-only">Uploading…</span>
          </span>
        )}
      </button>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] text-espresso-500">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void handle(e.target.files?.[0])}
      />
    </div>
  );
}
