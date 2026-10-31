import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRestaurantContext, requireMenuAccess } from "@/lib/services/context";
import { getTemplate } from "@/lib/templates";
import { MenuEditor } from "@/components/editor/menu-editor";

export const metadata: Metadata = { title: "Menu editor" };

export default async function MenuEditorPage(props: PageProps<"/dashboard/menus/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await getRestaurantContext();
  let access;
  try {
    access = await requireMenuAccess(id);
  } catch {
    notFound();
  }
  const { repo, restaurant, plan, menu } = access;
  const [tree, branding] = await Promise.all([repo.getMenuTree(id), repo.getBranding(restaurant.id)]);
  if (!tree) notFound();
  const { restaurantId: _r, updatedAt: _u, ...brandingInput } = branding ?? { restaurantId: "", updatedAt: "", ...getTemplate("modern-bistro").branding };
  return (
    <MenuEditor
      key={menu.id}
      menu={menu}
      initialContent={{ name: tree.name, description: tree.description, currency: tree.currency, categories: tree.categories }}
      restaurant={restaurant}
      branding={brandingInput}
      showBadge={!plan.removeBadge}
      focusItemId={typeof sp.item === "string" ? sp.item : null}
    />
  );
}
