import { NextResponse } from "next/server";
import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/env";
import { requireRestaurantAccess } from "@/lib/services/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UPLOAD_DIR } from "@/lib/data/local/store";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Checks magic bytes so a renamed file can't masquerade as an image. */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const restaurantId = String(form?.get("restaurantId") ?? "");
  const kind = String(form?.get("kind") ?? "item");
  if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(restaurantId)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!["logo", "cover", "item"].includes(kind)) return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });

  let access;
  try {
    access = await requireRestaurantAccess(restaurantId);
  } catch {
    return NextResponse.json({ error: "You don't have access to this restaurant." }, { status: 403 });
  }

  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !TYPES[type]) return NextResponse.json({ error: "Upload a JPG, PNG or WebP image." }, { status: 415 });

  const name = `${kind}-${randomUUID()}.${TYPES[type]}`;
  const storagePath = `${restaurantId}/${name}`;
  let url: string;

  if (isDemoMode()) {
    const dir = path.join(UPLOAD_DIR, restaurantId);
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, name), buf);
    url = `/api/uploads/${storagePath}`;
  } else {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("media").upload(storagePath, buf, { contentType: type, upsert: false });
    if (error) return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    url = supabase.storage.from("media").getPublicUrl(storagePath).data.publicUrl;
  }

  await access.repo.recordImage(restaurantId, storagePath, url, access.user.id);
  return NextResponse.json({ url });
}
