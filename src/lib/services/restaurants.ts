import "server-only";
import { cookies } from "next/headers";
import type { Repo } from "@/lib/data";
import type { Activity, BrandingInput, Currency, MenuContent } from "@/lib/domain";
import { minimumPlanForTemplate, PLANS, planRank, BRANDING_FIELDS } from "@/lib/plans";
import type { PlanDefinition } from "@/lib/plans";
import { getTemplate } from "@/lib/templates";
import { RESERVED_SLUGS } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { ACTIVE_RESTAURANT_COOKIE, EntitlementError, getRestaurantPlan } from "./context";

export async function logActivity(
  repo: Repo,
  restaurantId: string,
  userId: string | null,
  kind: Activity["kind"],
  message: string,
) {
  try {
    await repo.logActivity({ restaurantId, userId, kind, message });
  } catch (err) {
    console.warn("[activity] failed to log", err);
  }
}

export async function setActiveRestaurant(restaurantId: string) {
  const jar = await cookies();
  jar.set(ACTIVE_RESTAURANT_COOKIE, restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function assertSlugAvailable(repo: Repo, slug: string, exceptId?: string) {
  if (RESERVED_SLUGS.has(slug)) throw new Error("SLUG_TAKEN");
  if (await repo.isSlugTaken(slug, exceptId)) throw new Error("SLUG_TAKEN");
}

export async function suggestSlug(repo: Repo, name: string) {
  const base = slugify(name) || "restaurant";
  let candidate = base;
  for (let i = 2; i < 50; i++) {
    if (!RESERVED_SLUGS.has(candidate) && !(await repo.isSlugTaken(candidate))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Restaurant creation limit is based on the creating user's own plan. */
export async function assertCanCreateRestaurant(repo: Repo, userId: string) {
  const { plan } = await getRestaurantPlan(userId);
  const owned = await repo.countRestaurantsOwned(userId);
  if (owned >= plan.limits.restaurants) {
    throw new EntitlementError(
      `Your ${plan.name} plan includes ${plan.limits.restaurants} restaurant${plan.limits.restaurants === 1 ? "" : "s"}. Upgrade to Business for multiple locations.`,
      "business",
    );
  }
}

export async function assertCanCreateMenu(repo: Repo, restaurantId: string, plan: PlanDefinition) {
  const menus = await repo.listMenus(restaurantId);
  const active = menus.filter((m) => !m.archived).length;
  if (active >= plan.limits.menus) {
    const next = plan.id === "free" ? "starter" : "pro";
    throw new EntitlementError(
      `Your ${plan.name} plan includes ${plan.limits.menus} menu${plan.limits.menus === 1 ? "" : "s"}. Upgrade to ${PLANS[next].name} for more.`,
      next,
    );
  }
}

export async function uniqueMenuSlug(repo: Repo, restaurantId: string, name: string, exceptMenuId?: string) {
  const menus = await repo.listMenus(restaurantId);
  const taken = new Set(menus.filter((m) => m.id !== exceptMenuId).map((m) => m.slug));
  const base = slugify(name) || "menu";
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/**
 * Applies plan entitlements to a requested branding config: locked fields keep
 * their current (or template default) values. Locked templates are rejected.
 */
export function enforceBranding(requested: BrandingInput, current: BrandingInput, plan: PlanDefinition): BrandingInput {
  if (!plan.templates.includes(requested.template) && requested.template !== current.template) {
    const required = minimumPlanForTemplate(requested.template);
    throw new EntitlementError(
      `The ${getTemplate(requested.template).name} template is available on the ${PLANS[required].name} plan.`,
      required,
    );
  }
  const allowed = new Set(BRANDING_FIELDS[plan.branding]);
  const templateDefaults = getTemplate(requested.template).branding;
  const templateChanged = requested.template !== current.template;
  const out = { ...requested } as Record<string, unknown>;
  for (const key of Object.keys(requested) as (keyof BrandingInput)[]) {
    if (!allowed.has(key)) {
      // Locked field: follow the template when switching, otherwise keep what's stored.
      out[key] = templateChanged ? templateDefaults[key] : current[key];
    }
  }
  return out as unknown as BrandingInput;
}

export function requiredPlanForBrandingField(field: keyof BrandingInput) {
  if (BRANDING_FIELDS.basic.includes(field)) return "free" as const;
  if (BRANDING_FIELDS.standard.includes(field)) return "starter" as const;
  return "pro" as const;
}

export function isPlanAtLeast(plan: PlanDefinition, required: keyof typeof PLANS) {
  return planRank(plan.id) >= planRank(required);
}

export function starterMenuContent(
  name: string,
  currency: Currency,
  category: string,
  items: { name: string; price: number; description: string }[],
): MenuContent {
  const categoryId = crypto.randomUUID();
  return {
    name,
    description: "",
    currency,
    categories: [
      {
        id: categoryId,
        name: category || "Mains",
        description: "",
        position: 0,
        items: items.map((it, i) => ({
          id: crypto.randomUUID(),
          categoryId,
          name: it.name,
          description: it.description,
          price: it.price,
          available: true,
          featured: false,
          archived: false,
          dietary: [],
          allergens: [],
          imageUrl: null,
          position: i,
        })),
      },
    ],
  };
}
