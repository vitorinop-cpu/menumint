import "server-only";
import { cache } from "react";
import { getSystemRepo } from "@/lib/data";
import type { BrandingInput } from "@/lib/domain";
import { getTemplate } from "@/lib/templates";
import { getRestaurantPlan } from "./context";
import { formatPrice } from "@/lib/utils";
import type { PublishedMenu, Restaurant } from "@/lib/domain";
import { env } from "@/lib/env";

/** Loads only public, published data for a restaurant slug. */
export const getPublicRestaurant = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{1,48}$/.test(slug)) return null;
  const repo = getSystemRepo();
  const restaurant = await repo.getRestaurantBySlug(slug);
  if (!restaurant) return null;
  const [branding, published, { plan }] = await Promise.all([
    repo.getBranding(restaurant.id),
    repo.getPublishedMenus(restaurant.id),
    getRestaurantPlan(restaurant.ownerId),
  ]);
  const { restaurantId: _r, updatedAt: _u, ...brandingInput } = branding ?? {
    restaurantId: "",
    updatedAt: "",
    ...getTemplate("modern-bistro").branding,
  };
  return { restaurant, branding: brandingInput as BrandingInput, published, showBadge: !plan.removeBadge };
});

export function menuJsonLd(restaurant: Restaurant, menu: PublishedMenu) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.tagline || restaurant.description || undefined,
    address: restaurant.address || undefined,
    telephone: restaurant.phone || undefined,
    servesCuisine: restaurant.cuisine || undefined,
    image: restaurant.coverUrl ? new URL(restaurant.coverUrl, env.appUrl).toString() : undefined,
    hasMenu: {
      "@type": "Menu",
      name: menu.content.name,
      hasMenuSection: menu.content.categories.map((c) => ({
        "@type": "MenuSection",
        name: c.name,
        hasMenuItem: c.items.map((i) => ({
          "@type": "MenuItem",
          name: i.name,
          description: i.description || undefined,
          offers: { "@type": "Offer", price: (i.price / 100).toFixed(2), priceCurrency: menu.content.currency },
          suitableForDiet: i.dietary.includes("vegan")
            ? "https://schema.org/VeganDiet"
            : i.dietary.includes("vegetarian")
              ? "https://schema.org/VegetarianDiet"
              : i.dietary.includes("gluten-free")
                ? "https://schema.org/GlutenFreeDiet"
                : undefined,
        })),
      })),
    },
  };
}

export function describeMenu(menu: PublishedMenu) {
  const items = menu.content.categories.flatMap((c) => c.items).slice(0, 3);
  return items.map((i) => `${i.name} ${formatPrice(i.price, menu.content.currency)}`).join(" · ");
}
