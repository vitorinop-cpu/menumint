"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CURRENCIES } from "@/lib/domain";
import type { MenuContent } from "@/lib/domain";
import { menuContentSchema } from "@/lib/validation";
import { requireMenuAccess, requireRestaurantAccess } from "@/lib/services/context";
import { fail, toFailure } from "@/lib/services/result";
import { assertCanCreateMenu, logActivity, uniqueMenuSlug } from "@/lib/services/restaurants";

const newMenuSchema = z.object({
  name: z.string().trim().min(1, "Name your menu").max(80),
  description: z.string().trim().max(300).default(""),
  currency: z.enum(CURRENCIES).optional(),
});

function revalidateMenus(slug?: string) {
  revalidatePath("/dashboard", "layout");
  if (slug) revalidatePath(`/m/${slug}`, "layout");
}

export async function createMenuAction(restaurantId: string, input: unknown) {
  try {
    const { repo, restaurant, plan, user } = await requireRestaurantAccess(restaurantId);
    const values = newMenuSchema.parse(input);
    await assertCanCreateMenu(repo, restaurantId, plan);
    const slug = await uniqueMenuSlug(repo, restaurantId, values.name);
    const currency = values.currency ?? restaurant.currency;
    const categoryId = crypto.randomUUID();
    const menu = await repo.createMenu(
      restaurantId,
      { name: values.name, slug, description: values.description, currency },
      {
        name: values.name,
        description: values.description,
        currency,
        categories: [{ id: categoryId, name: "Starters", description: "", position: 0, items: [] }],
      },
    );
    await logActivity(repo, restaurantId, user.id, "menu_created", `Created menu “${menu.name}”`);
    revalidateMenus();
    return { ok: true as const, data: { menuId: menu.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function renameMenuAction(menuId: string, name: string) {
  try {
    const { repo, menu } = await requireMenuAccess(menuId);
    const clean = z.string().trim().min(1, "Name your menu").max(80).parse(name);
    const tree = await repo.getMenuTree(menuId);
    if (!tree) return fail("Menu not found.");
    const slug = await uniqueMenuSlug(repo, menu.restaurantId, clean, menuId);
    await repo.saveMenuContent(menuId, { ...tree, name: clean });
    await repo.updateMenuMeta(menuId, { name: clean, slug });
    revalidateMenus();
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function duplicateMenuAction(menuId: string) {
  try {
    const { repo, menu, plan, user } = await requireMenuAccess(menuId);
    await assertCanCreateMenu(repo, menu.restaurantId, plan);
    const tree = await repo.getMenuTree(menuId);
    if (!tree) return fail("Menu not found.");
    const name = `${tree.name} (copy)`.slice(0, 80);
    const content: MenuContent = {
      name,
      description: tree.description,
      currency: tree.currency,
      categories: tree.categories.map((c) => {
        const id = crypto.randomUUID();
        return { ...c, id, items: c.items.map((i) => ({ ...i, id: crypto.randomUUID(), categoryId: id })) };
      }),
    };
    const slug = await uniqueMenuSlug(repo, menu.restaurantId, name);
    const copy = await repo.createMenu(menu.restaurantId, { name, slug, description: tree.description, currency: tree.currency }, content);
    await logActivity(repo, menu.restaurantId, user.id, "menu_duplicated", `Duplicated “${tree.name}”`);
    revalidateMenus();
    return { ok: true as const, data: { menuId: copy.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function setMenuArchivedAction(menuId: string, archived: boolean) {
  try {
    const { repo, menu, plan, user, restaurant } = await requireMenuAccess(menuId);
    if (!archived) await assertCanCreateMenu(repo, menu.restaurantId, plan);
    if (archived && menu.status === "published") await repo.unpublishMenu(menuId);
    await repo.updateMenuMeta(menuId, { archived });
    if (archived) await logActivity(repo, menu.restaurantId, user.id, "menu_archived", `Archived “${menu.name}”`);
    revalidateMenus(restaurant.slug);
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function saveMenuContentAction(menuId: string, content: unknown) {
  try {
    const { repo } = await requireMenuAccess(menuId);
    const parsed = menuContentSchema.parse(content) as MenuContent;
    // Item category ids must match their parent category.
    parsed.categories = parsed.categories.map((c, ci) => ({
      ...c,
      position: ci,
      items: c.items.map((i, ii) => ({ ...i, categoryId: c.id, position: ii })),
    }));
    const menu = await repo.saveMenuContent(menuId, parsed);
    return { ok: true as const, data: { savedAt: menu.updatedAt, hasUnpublishedChanges: menu.hasUnpublishedChanges, status: menu.status } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function publishMenuAction(menuId: string) {
  try {
    const { repo, menu, user, restaurant } = await requireMenuAccess(menuId);
    if (menu.archived) return fail("Restore this menu before publishing it.");
    const tree = await repo.getMenuTree(menuId);
    const liveItems = tree?.categories.flatMap((c) => c.items.filter((i) => !i.archived)).length ?? 0;
    if (liveItems === 0) return fail("Add at least one item before publishing.");
    const published = await repo.publishMenu(menuId);
    await logActivity(repo, menu.restaurantId, user.id, "menu_published", `Published “${published.name}”`);
    revalidateMenus(restaurant.slug);
    return { ok: true as const, data: { publishedAt: published.publishedAt } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function unpublishMenuAction(menuId: string) {
  try {
    const { repo, menu, user, restaurant } = await requireMenuAccess(menuId);
    await repo.unpublishMenu(menuId);
    await logActivity(repo, menu.restaurantId, user.id, "menu_unpublished", `Unpublished “${menu.name}”`);
    revalidateMenus(restaurant.slug);
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}
