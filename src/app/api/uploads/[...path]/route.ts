import fsp from "node:fs/promises";
import path from "node:path";
import { isDemoMode } from "@/lib/env";
import { UPLOAD_DIR } from "@/lib/data/local/store";

export const runtime = "nodejs";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Demo-mode file server for uploaded images (Supabase Storage serves them in production). */
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[...path]">) {
  if (!isDemoMode()) return new Response("Not found", { status: 404 });
  const parts = (await ctx.params).path;
  if (parts.length !== 2 || !/^[0-9a-f-]{36}$/i.test(parts[0]) || !/^(logo|cover|item)-[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(parts[1])) {
    return new Response("Not found", { status: 404 });
  }
  const file = path.join(UPLOAD_DIR, parts[0], parts[1]);
  try {
    const data = await fsp.readFile(file);
    const ext = parts[1].split(".").pop()!.toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
