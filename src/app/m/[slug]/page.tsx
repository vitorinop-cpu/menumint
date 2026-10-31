import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getPublicRestaurant, describeMenu } from "@/lib/services/public";
import { PublicMenuPage } from "@/components/public-menu/public-menu-page";
import { MenuComingSoon } from "@/components/public-menu/menu-coming-soon";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getPublicRestaurant(slug);
  if (!data) return { title: "Menu not found", robots: { index: false } };
  const { restaurant, published } = data;
  const description = restaurant.tagline || (published[0] ? describeMenu(published[0]) : `Menu for ${restaurant.name}`);
  return {
    title: { absolute: `${restaurant.name} — Menu` },
    description,
    alternates: { canonical: `/m/${restaurant.slug}` },
    openGraph: {
      title: `${restaurant.name} — Menu`,
      description,
      images: restaurant.coverUrl ? [{ url: restaurant.coverUrl }] : undefined,
    },
    robots: published.length ? undefined : { index: false },
  };
}

export async function generateViewport(props: PageProps<"/m/[slug]">): Promise<Viewport> {
  const { slug } = await props.params;
  const data = await getPublicRestaurant(slug);
  return { themeColor: data?.branding.backgroundColor ?? "#FFF9F2" };
}

export default async function RestaurantMenuPage(props: PageProps<"/m/[slug]">) {
  const { slug } = await props.params;
  const data = await getPublicRestaurant(slug);
  if (!data) notFound();
  if (data.published.length === 0) return <MenuComingSoon name={data.restaurant.name} />;
  return (
    <PublicMenuPage
      restaurant={data.restaurant}
      branding={data.branding}
      published={data.published}
      active={data.published[0]}
      showBadge={data.showBadge}
    />
  );
}
