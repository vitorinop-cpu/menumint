import "server-only";
import { getRepo } from "@/lib/data";
import type { AnalyticsEvent, DeviceClass, MenuItem } from "@/lib/domain";

export interface AnalyticsSummary {
  range: { from: string; to: string; days: number };
  totals: { views: number; scans: number; itemViews: number };
  previous: { views: number; scans: number; itemViews: number };
  series: { date: string; views: number; scans: number }[];
  topItems: { itemId: string; name: string; imageUrl: string | null; menuName: string; views: number }[];
  devices: { device: DeviceClass; count: number }[];
  qrCodes: { qrCodeId: string; name: string; scans: number }[];
  menus: { menuId: string; name: string; views: number }[];
  hasDemoData: boolean;
  isEmpty: boolean;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function count(events: AnalyticsEvent[]) {
  let views = 0;
  let scans = 0;
  let itemViews = 0;
  for (const e of events) {
    if (e.type === "menu_view") views++;
    else if (e.type === "qr_scan") scans++;
    else itemViews++;
  }
  return { views, scans, itemViews };
}

/**
 * Aggregates raw events for a restaurant. Callers must have verified membership
 * and clamped `days` to the plan's analytics window.
 */
export async function getAnalyticsSummary(restaurantId: string, days: number): Promise<AnalyticsSummary> {
  const repo = await getRepo();
  const to = new Date();
  const from = new Date(to);
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const prevFrom = new Date(from.getTime() - days * 86400000);

  const [events, previousEvents, menus, qrCodes] = await Promise.all([
    repo.listEvents(restaurantId, from.toISOString(), to.toISOString()),
    repo.listEvents(restaurantId, prevFrom.toISOString(), new Date(from.getTime() - 1).toISOString()),
    repo.listMenus(restaurantId),
    repo.listQrCodes(restaurantId),
  ]);

  const seriesMap = new Map<string, { views: number; scans: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    seriesMap.set(dayKey(d), { views: 0, scans: 0 });
  }
  const itemCounts = new Map<string, number>();
  const deviceCounts = new Map<DeviceClass, number>();
  const qrCounts = new Map<string, number>();
  const menuCounts = new Map<string, number>();

  for (const e of events) {
    const bucket = seriesMap.get(e.occurredAt.slice(0, 10));
    if (e.type === "menu_view") {
      if (bucket) bucket.views++;
      deviceCounts.set(e.device, (deviceCounts.get(e.device) ?? 0) + 1);
      if (e.menuId) menuCounts.set(e.menuId, (menuCounts.get(e.menuId) ?? 0) + 1);
    } else if (e.type === "qr_scan") {
      if (bucket) bucket.scans++;
      if (e.qrCodeId) qrCounts.set(e.qrCodeId, (qrCounts.get(e.qrCodeId) ?? 0) + 1);
    } else if (e.itemId) {
      itemCounts.set(e.itemId, (itemCounts.get(e.itemId) ?? 0) + 1);
    }
  }

  // Resolve item names from current drafts (falls back gracefully for deleted items).
  const itemIndex = new Map<string, { item: MenuItem; menuName: string }>();
  const trees = await Promise.all(menus.map((m) => repo.getMenuTree(m.id)));
  for (const tree of trees) {
    if (!tree) continue;
    for (const c of tree.categories) for (const i of c.items) itemIndex.set(i.id, { item: i, menuName: tree.menu.name });
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([itemId, views]) => {
      const hit = itemIndex.get(itemId);
      return {
        itemId,
        views,
        name: hit?.item.name ?? "Removed item",
        imageUrl: hit?.item.imageUrl ?? null,
        menuName: hit?.menuName ?? "",
      };
    });

  const totals = count(events);
  return {
    range: { from: from.toISOString(), to: to.toISOString(), days },
    totals,
    previous: count(previousEvents),
    series: [...seriesMap.entries()].map(([date, v]) => ({ date, ...v })),
    topItems,
    devices: (["mobile", "tablet", "desktop", "unknown"] as DeviceClass[])
      .map((device) => ({ device, count: deviceCounts.get(device) ?? 0 }))
      .filter((d) => d.count > 0),
    qrCodes: qrCodes.map((q) => ({ qrCodeId: q.id, name: q.name, scans: qrCounts.get(q.id) ?? 0 })),
    menus: menus.map((m) => ({ menuId: m.id, name: m.name, views: menuCounts.get(m.id) ?? 0 })),
    hasDemoData: events.some((e) => e.isDemo),
    isEmpty: events.length === 0,
  };
}

export function deviceFromUserAgent(ua: string | null): DeviceClass {
  if (!ua) return "unknown";
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  if (/bot|crawl|spider|preview/i.test(ua)) return "unknown";
  return "desktop";
}

export function isBot(ua: string | null) {
  return !ua || /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse/i.test(ua);
}

export function referrerHost(referer: string | null, ownHost: string | null) {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    return host === ownHost ? null : host.slice(0, 120);
  } catch {
    return null;
  }
}
