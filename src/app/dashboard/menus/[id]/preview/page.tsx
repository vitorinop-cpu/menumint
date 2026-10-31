import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, EyeOff } from "lucide-react";
import { requireMenuAccess } from "@/lib/services/context";
import { getTemplate } from "@/lib/templates";
import { MenuView } from "@/components/public-menu/menu-view";

export const metadata: Metadata = { title: "Draft preview", robots: { index: false } };

/**
 * Full-screen preview of the saved draft (not the published snapshot).
 * Rendered outside the dashboard chrome via a fixed overlay.
 */
export default async function MenuPreviewPage(props: PageProps<"/dashboard/menus/[id]/preview">) {
  const { id } = await props.params;
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
    <div className="fixed inset-0 z-[60] flex flex-col bg-ivory">
      <div className="flex items-center gap-3 bg-espresso px-4 py-2.5 text-sm text-ivory">
        <Link href={`/dashboard/menus/${menu.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium hover:bg-white/10">
          <ArrowLeft className="size-4" aria-hidden /> Back to editor
        </Link>
        <span className="ml-auto inline-flex items-center gap-1.5 text-ivory/80">
          <EyeOff className="size-4" aria-hidden /> Draft preview — guests can&apos;t see this until you publish
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <MenuView mode="preview" restaurant={restaurant} branding={brandingInput} content={tree} showBadge={!plan.removeBadge} className="mx-auto max-w-3xl" />
      </div>
    </div>
  );
}
