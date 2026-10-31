"use server";

import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";

export interface SearchHit {
  type: "menu" | "item" | "qr";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** Searches the active restaurant's menus, dishes and QR codes. */
export async function dashboardSearchAction(query: string): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase().slice(0, 80);
  if (q.length < 2) return [];
  const { restaurant } = await getRestaurantContext();
  const repo = await getRepo();
  const [menus, qrCodes] = await Promise.all([repo.listMenus(restaurant.id), repo.listQrCodes(restaurant.id)]);
  const hits: SearchHit[] = [];
  for (const m of menus) {
    if (m.name.toLowerCase().includes(q)) {
      hits.push({ type: "menu", id: m.id, title: m.name, subtitle: `${m.itemCount} items · ${m.status}`, href: `/dashboard/menus/${m.id}` });
    }
  }
  const trees = await Promise.all(menus.filter((m) => !m.archived).map((m) => repo.getMenuTree(m.id)));
  for (const t of trees) {
    if (!t) continue;
    for (const c of t.categories) {
      for (const i of c.items) {
        if (i.archived) continue;
        if (i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) {
          hits.push({ type: "item", id: i.id, title: i.name, subtitle: `${t.menu.name} › ${c.name}`, href: `/dashboard/menus/${t.menu.id}?item=${i.id}` });
        }
      }
    }
  }
  for (const qr of qrCodes) {
    if (qr.name.toLowerCase().includes(q)) hits.push({ type: "qr", id: qr.id, title: qr.name, subtitle: "QR code", href: `/dashboard/qr?code=${qr.id}` });
  }
  return hits.slice(0, 20);
}
