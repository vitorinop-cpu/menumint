"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/domain";
import { getTemplate } from "@/lib/templates";
import { CUISINES } from "@/lib/domain";
import { parsePrice } from "@/lib/utils";
import { restaurantInfoSchema, slugSchema } from "@/lib/validation";
import { requireRestaurantAccess } from "@/lib/services/context";
import { fail, toFailure } from "@/lib/services/result";
import {
  assertCanCreateMenu,
  assertCanCreateRestaurant,
  assertSlugAvailable,
  logActivity,
  setActiveRestaurant,
  starterMenuContent,
  suggestSlug,
  uniqueMenuSlug,
} from "@/lib/services/restaurants";

async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");
  return user;
}

export async function saveOnboardingProgressAction(draft: OnboardingDraft) {
  try {
    const user = await requireSignedIn();
    const safe = z.object({ step: z.number().int().min(0).max(8), data: z.record(z.string(), z.unknown()) }).parse(draft);
    const repo = await getRepo();
    await repo.updateProfile(user.id, { onboarding: safe as OnboardingDraft });
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function checkSlugAction(slug: string, exceptRestaurantId?: string) {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { available: false, reason: parsed.error.issues[0]?.message ?? "Invalid" };
  const repo = await getRepo();
  try {
    await assertSlugAvailable(repo, parsed.data, exceptRestaurantId);
    return { available: true, reason: "" };
  } catch {
    return { available: false, reason: "That link is already taken." };
  }
}

export async function suggestSlugAction(name: string) {
  const repo = await getRepo();
  return suggestSlug(repo, name.slice(0, 80));
}

/** Step 2: creates the restaurant (or updates it when the user navigates back). */
export async function saveRestaurantInfoAction(input: unknown, existingRestaurantId?: string | null) {
  try {
    const user = await requireSignedIn();
    const values = restaurantInfoSchema.parse(input);
    const repo = await getRepo();
    if (existingRestaurantId) {
      await requireRestaurantAccess(existingRestaurantId, { owner: true });
      await assertSlugAvailable(repo, values.slug, existingRestaurantId);
      const r = await repo.updateRestaurant(existingRestaurantId, values);
      return { ok: true as const, data: { restaurantId: r.id } };
    }
    await assertCanCreateRestaurant(repo, user.id);
    await assertSlugAvailable(repo, values.slug);
    const r = await repo.createRestaurant(
      user.id,
      { ...values, description: "", cuisine: "", website: "", logoUrl: null, coverUrl: null },
      getTemplate("modern-bistro").branding,
    );
    await setActiveRestaurant(r.id);
    await logActivity(repo, r.id, user.id, "restaurant_created", `Created ${r.name}`);
    return { ok: true as const, data: { restaurantId: r.id } };
  } catch (err) {
    return toFailure(err);
  }
}

const detailsSchema = z.object({
  logoUrl: z.string().max(600).nullable().optional(),
  coverUrl: z.string().max(600).nullable().optional(),
  cuisine: z.enum(CUISINES).optional(),
});

/** Steps 3–4: logo, cover and cuisine. */
export async function saveRestaurantDetailsAction(restaurantId: string, input: unknown) {
  try {
    const { repo } = await requireRestaurantAccess(restaurantId);
    const values = detailsSchema.parse(input);
    for (const url of [values.logoUrl, values.coverUrl]) {
      if (url && !(url.startsWith("/api/uploads/") || url.startsWith("/images/") || url.startsWith("https://"))) {
        return fail("Invalid image URL");
      }
    }
    await repo.updateRestaurant(restaurantId, values);
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

const firstMenuSchema = z.object({
  menuName: z.string().trim().min(1, "Name your menu").max(80),
  firstCategory: z.string().trim().min(1, "Add a category").max(80),
  firstItems: z
    .array(z.object({ name: z.string().trim().max(100), price: z.string().max(20), description: z.string().trim().max(500) }))
    .max(10),
});

/** Step 7: creates the first menu (or replaces its content when revisited). */
export async function createFirstMenuAction(restaurantId: string, input: unknown, existingMenuId?: string | null) {
  try {
    const { repo, restaurant, plan, user } = await requireRestaurantAccess(restaurantId);
    const values = firstMenuSchema.parse(input);
    const items = values.firstItems
      .filter((i) => i.name)
      .map((i) => ({ name: i.name, description: i.description, price: parsePrice(i.price, restaurant.currency) ?? 0 }));
    if (items.length === 0) return fail("Add at least one dish.", { fieldErrors: { firstItems: "Add at least one dish." } });
    const content = starterMenuContent(values.menuName, restaurant.currency, values.firstCategory, items);

    if (existingMenuId) {
      const menu = await repo.getMenu(existingMenuId);
      if (menu && menu.restaurantId === restaurantId) {
        await repo.saveMenuContent(menu.id, content);
        return { ok: true as const, data: { menuId: menu.id } };
      }
    }
    await assertCanCreateMenu(repo, restaurantId, plan);
    const slug = await uniqueMenuSlug(repo, restaurantId, values.menuName);
    const menu = await repo.createMenu(restaurantId, { name: values.menuName, slug, description: "", currency: restaurant.currency }, content);
    await logActivity(repo, restaurantId, user.id, "menu_created", `Created menu “${menu.name}”`);
    return { ok: true as const, data: { menuId: menu.id } };
  } catch (err) {
    return toFailure(err);
  }
}

export async function finishOnboardingAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const repo = await getRepo();
  await repo.updateProfile(user.id, { onboarding: null });
  redirect("/dashboard?welcome=1");
}
