import { MenuView } from "./menu-view";
import { menuJsonLd } from "@/lib/services/public";
import type { BrandingInput, PublishedMenu, Restaurant } from "@/lib/domain";

export function PublicMenuPage({
  restaurant,
  branding,
  published,
  active,
  showBadge,
}: {
  restaurant: Restaurant;
  branding: BrandingInput;
  published: PublishedMenu[];
  active: PublishedMenu;
  showBadge: boolean;
}) {
  const jsonLd = JSON.stringify(menuJsonLd(restaurant, active)).replace(/</g, "\\u003c");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <MenuView
        mode="public"
        restaurant={{
          id: restaurant.id,
          slug: restaurant.slug,
          name: restaurant.name,
          tagline: restaurant.tagline,
          logoUrl: restaurant.logoUrl,
          coverUrl: restaurant.coverUrl,
          address: restaurant.address,
          phone: restaurant.phone,
          website: restaurant.website,
        }}
        branding={branding}
        content={active.content}
        menuId={active.menu.id}
        menus={published.map((p) => ({ id: p.menu.id, name: p.content.name, slug: p.menu.slug }))}
        showBadge={showBadge}
      />
    </>
  );
}
