import type { Metadata } from "next";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { MenusBoard } from "@/components/menus/menus-board";

export const metadata: Metadata = { title: "Menus" };

export default async function MenusPage(props: PageProps<"/dashboard/menus">) {
  const sp = await props.searchParams;
  const { restaurant, plan } = await getRestaurantContext();
  const repo = await getRepo();
  const menus = await repo.listMenus(restaurant.id);
  const trees = await Promise.all(menus.map((m) => repo.getMenuTree(m.id)));
  const covers = Object.fromEntries(
    trees.filter(Boolean).map((t) => [t!.menu.id, t!.categories.flatMap((c) => c.items).find((i) => i.imageUrl && !i.archived)?.imageUrl ?? null]),
  );
  return (
    <MenusBoard
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
      currency={restaurant.currency}
      menus={menus}
      covers={covers}
      menuLimit={plan.limits.menus}
      planName={plan.name}
      openNew={sp.new === "1"}
    />
  );
}
