import { NextResponse } from "next/server";
import { getSystemRepo } from "@/lib/data";
import { deviceFromUserAgent, isBot } from "@/lib/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stable QR redirect. Printed codes always point at /q/<code>; the destination
 * is resolved at scan time so menus can change without reprinting.
 */
export async function GET(req: Request, ctx: RouteContext<"/q/[code]">) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  if (!/^[a-z0-9]{6,16}$/.test(code)) return NextResponse.redirect(new URL("/menu-unavailable", url), 302);

  const repo = getSystemRepo();
  const qr = await repo.getQrByCode(code);
  if (!qr || qr.archived) return NextResponse.redirect(new URL("/menu-unavailable", url), 302);
  const restaurant = await repo.getRestaurant(qr.restaurantId);
  if (!restaurant) return NextResponse.redirect(new URL("/menu-unavailable", url), 302);

  const published = await repo.getPublishedMenus(restaurant.id);
  const target = qr.menuId ? published.find((p) => p.menu.id === qr.menuId) : published[0];
  const destination = target ? `/m/${restaurant.slug}/${target.menu.slug}` : `/m/${restaurant.slug}`;

  const ua = req.headers.get("user-agent");
  const preview = url.searchParams.get("preview") === "1";
  if (!preview && !isBot(ua) && req.headers.get("dnt") !== "1" && req.headers.get("sec-gpc") !== "1") {
    try {
      await repo.recordEvent({
        restaurantId: restaurant.id,
        type: "qr_scan",
        menuId: target?.menu.id ?? null,
        itemId: null,
        qrCodeId: qr.id,
        device: deviceFromUserAgent(ua),
        referrerHost: null,
        isDemo: false,
        occurredAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[qr] failed to record scan", err);
    }
  }
  const dest = new URL(destination, url);
  dest.searchParams.set("src", "qr");
  return NextResponse.redirect(dest, 302);
}
