import type { Metadata } from "next";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { QrStudio } from "@/components/qr/qr-studio";

export const metadata: Metadata = { title: "QR Studio" };

export default async function QrPage(props: PageProps<"/dashboard/qr">) {
  const sp = await props.searchParams;
  const { restaurant, plan } = await getRestaurantContext();
  const repo = await getRepo();
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 86400000);
  const [qrCodes, menus, events] = await Promise.all([
    repo.listQrCodes(restaurant.id),
    repo.listMenus(restaurant.id),
    repo.listEvents(restaurant.id, from.toISOString(), now.toISOString()),
  ]);
  const scans: Record<string, number> = {};
  for (const e of events) if (e.type === "qr_scan" && e.qrCodeId) scans[e.qrCodeId] = (scans[e.qrCodeId] ?? 0) + 1;
  return (
    <QrStudio
      restaurant={{ id: restaurant.id, name: restaurant.name, slug: restaurant.slug, logoUrl: restaurant.logoUrl }}
      initialCodes={qrCodes}
      menus={menus.filter((m) => !m.archived).map((m) => ({ id: m.id, name: m.name, slug: m.slug, published: m.status === "published" }))}
      scans={scans}
      qrLevel={plan.qr}
      planName={plan.name}
      initialSelected={typeof sp.code === "string" ? sp.code : null}
    />
  );
}
