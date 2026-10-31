import { NextResponse } from "next/server";
import { getSystemRepo } from "@/lib/data";
import { trackSchema } from "@/lib/validation";
import { deviceFromUserAgent, isBot, referrerHost } from "@/lib/services/analytics";

export const runtime = "nodejs";

/**
 * Privacy-conscious event ingestion: no cookies, IPs or user agents are stored —
 * only the event type, the content it relates to, a coarse device class and the
 * referring host. Honours Do Not Track / Global Privacy Control.
 */
export async function POST(req: Request) {
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const { type, restaurantId, menuId = null, itemId = null } = parsed.data;

  const repo = getSystemRepo();
  // Only accept events for content that is actually published.
  const published = await repo.getPublishedMenus(restaurantId);
  const menu = published.find((p) => p.menu.id === menuId);
  if (!menu) return NextResponse.json({ error: "Unknown menu" }, { status: 404 });
  if (type === "item_view" && !menu.content.categories.some((c) => c.items.some((i) => i.id === itemId))) {
    return NextResponse.json({ error: "Unknown item" }, { status: 404 });
  }

  const body2 = (body as { referrer?: unknown }) ?? {};
  const host = req.headers.get("host")?.split(":")[0] ?? null;
  await repo.recordEvent({
    restaurantId,
    type,
    menuId,
    itemId: type === "item_view" ? itemId : null,
    qrCodeId: null,
    device: deviceFromUserAgent(ua),
    referrerHost: typeof body2.referrer === "string" ? referrerHost(body2.referrer, host) : null,
    isDemo: false,
    occurredAt: new Date().toISOString(),
  });
  return new NextResponse(null, { status: 204 });
}
