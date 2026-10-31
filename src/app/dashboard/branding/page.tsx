import type { Metadata } from "next";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { getTemplate } from "@/lib/templates";
import { BrandingStudio } from "@/components/branding/branding-studio";
import type { MenuContent } from "@/lib/domain";

export const metadata: Metadata = { title: "Branding studio" };

const FALLBACK: MenuContent = {
  name: "Sample menu",
  description: "",
  currency: "USD",
  categories: [
    {
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "Starters",
      description: "Add your own dishes in the menu editor.",
      position: 0,
      items: [
        { id: "00000000-0000-4000-8000-0000000000b1", categoryId: "00000000-0000-4000-8000-0000000000a1", name: "Burrata & heirloom tomatoes", description: "Basil oil, sea salt", price: 1600, available: true, featured: true, archived: false, dietary: ["vegetarian"], allergens: ["milk"], imageUrl: "/images/dishes/burrata.jpg", position: 0 },
        { id: "00000000-0000-4000-8000-0000000000b2", categoryId: "00000000-0000-4000-8000-0000000000a1", name: "Saffron risotto", description: "Crispy sage", price: 2400, available: true, featured: false, archived: false, dietary: ["gluten-free"], allergens: ["milk"], imageUrl: "/images/dishes/risotto.jpg", position: 1 },
      ],
    },
  ],
};

export default async function BrandingPage() {
  const { restaurant, plan, role } = await getRestaurantContext();
  const repo = await getRepo();
  const [branding, menus] = await Promise.all([repo.getBranding(restaurant.id), repo.listMenus(restaurant.id)]);
  const previewMenu = menus.find((m) => m.status === "published" && !m.archived) ?? menus.find((m) => !m.archived);
  const tree = previewMenu ? await repo.getMenuTree(previewMenu.id) : null;
  const { restaurantId: _r, updatedAt: _u, ...initial } = branding ?? { restaurantId: "", updatedAt: "", ...getTemplate("modern-bistro").branding };
  return (
    <BrandingStudio
      restaurant={restaurant}
      initialBranding={initial}
      previewContent={tree && tree.categories.some((c) => c.items.length) ? tree : FALLBACK}
      plan={{ id: plan.id, name: plan.name, templates: plan.templates, branding: plan.branding, removeBadge: plan.removeBadge }}
      canEditMedia={role === "owner" || role === "editor"}
    />
  );
}
