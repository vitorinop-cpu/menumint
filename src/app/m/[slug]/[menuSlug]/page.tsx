import type { Metadata, Viewport } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicRestaurant, describeMenu } from "@/lib/services/public";
import { PublicMenuPage } from "@/components/public-menu/public-menu-page";
import { MenuComingSoon } from "@/components/public-menu/menu-coming-soon";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/m/[slug]/[menuSlug]">): Promise<Metadata> {
  const { slug, menuSlug } = await props.params;
  const data = await getPublicRestaurant(slug);
  const active = data?.published.find((p) => p.menu.slug === menuSlug);
  if (!data || !active) return { title: "Menu not found", robots: { index: false } };
  return {
    title: { absolute: `${active.content.name} · ${data.restaurant.name}` },
    description: data.restaurant.tagline || describeMenu(active),
    alternates: { canonical: `/m/${data.restaurant.slug}/${active.menu.slug}` },
    openGraph: {
      title: `${active.content.name} · ${data.restaurant.name}`,
      images: data.restaurant.coverUrl ? [{ url: data.restaurant.coverUrl }] : undefined,
    },
  };
}

export async function generateViewport(props: PageProps<"/m/[slug]/[menuSlug]">): Promise<Viewport> {
  const { slug } = await props.params;
  const data = await getPublicRestaurant(slug);
  return { themeColor: data?.branding.backgroundColor ?? "#FFF9F2" };
}

export default async function MenuPage(props: PageProps<"/m/[slug]/[menuSlug]">) {
  const { slug, menuSlug } = await props.params;
  const data = await getPublicRestaurant(slug);
  if (!data) notFound();
  if (data.published.length === 0) return <MenuComingSoon name={data.restaurant.name} />;
  const active = data.published.find((p) => p.menu.slug === menuSlug);
  // A menu that was renamed or unpublished falls back to the restaurant's main menu.
  if (!active) redirect(`/m/${data.restaurant.slug}`);
  return (
    <PublicMenuPage
      restaurant={data.restaurant}
      branding={data.branding}
      published={data.published}
      active={active}
      showBadge={data.showBadge}
    />
  );
}
