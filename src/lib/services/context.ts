import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo, getSystemRepo } from "@/lib/data";
import type { PlanId, Restaurant, Role, SessionUser, Subscription } from "@/lib/domain";
import { PLANS, type PlanDefinition } from "@/lib/plans";

export const ACTIVE_RESTAURANT_COOKIE = "mm_restaurant";

export class AuthzError extends Error {
  constructor(message = "You don't have access to this resource.") {
    super(message);
    this.name = "AuthzError";
  }
}

export class EntitlementError extends Error {
  constructor(
    message: string,
    public requiredPlan: PlanId,
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

/** Plan derived from a subscription row. Read server-side only. */
export function effectivePlan(sub: Subscription | null): PlanId {
  if (!sub) return "free";
  if (sub.source === "demo" || sub.source === "default") return sub.plan;
  return ["active", "trialing", "past_due"].includes(sub.status) ? sub.plan : "free";
}

/** Entitlements for a restaurant come from its owner's subscription. */
export const getRestaurantPlan = cache(async (ownerId: string): Promise<{ plan: PlanDefinition; subscription: Subscription | null }> => {
  const sub = await getSystemRepo().getSubscription(ownerId);
  return { plan: PLANS[effectivePlan(sub)], subscription: sub };
});

export interface RestaurantContext {
  user: SessionUser;
  restaurant: Restaurant;
  role: Role;
  restaurants: (Restaurant & { role: Role })[];
  plan: PlanDefinition;
  subscription: Subscription | null;
}

/** Dashboard context: signed-in user + active restaurant. Redirects when missing. */
export const getRestaurantContext = cache(async (): Promise<RestaurantContext> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const repo = await getRepo();
  const restaurants = await repo.listRestaurantsForUser(user.id);
  if (restaurants.length === 0) redirect("/onboarding");
  const jar = await cookies();
  const preferred = jar.get(ACTIVE_RESTAURANT_COOKIE)?.value;
  const active = restaurants.find((r) => r.id === preferred) ?? restaurants[0];
  const { plan, subscription } = await getRestaurantPlan(active.ownerId);
  return { user, restaurant: active, role: active.role, restaurants, plan, subscription };
});

/** For server actions: verifies the user is a member (optionally owner) of the restaurant. */
export async function requireRestaurantAccess(restaurantId: string, opts: { owner?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError("Please sign in again.");
  const repo = await getRepo();
  const membership = await repo.getMembership(user.id, restaurantId);
  if (!membership) throw new AuthzError();
  if (opts.owner && membership.role !== "owner") throw new AuthzError("Only the restaurant owner can do that.");
  const restaurant = await repo.getRestaurant(restaurantId);
  if (!restaurant) throw new AuthzError();
  const { plan, subscription } = await getRestaurantPlan(restaurant.ownerId);
  return { user, repo, membership, restaurant, plan, subscription };
}

/** Loads a menu and verifies membership of its restaurant. */
export async function requireMenuAccess(menuId: string) {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError("Please sign in again.");
  const repo = await getRepo();
  const menu = await repo.getMenu(menuId);
  if (!menu) throw new AuthzError("Menu not found.");
  const access = await requireRestaurantAccess(menu.restaurantId);
  return { ...access, menu };
}
