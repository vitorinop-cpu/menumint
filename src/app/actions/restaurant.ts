"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { emailSchema, restaurantUpdateSchema } from "@/lib/validation";
import { EntitlementError, requireRestaurantAccess } from "@/lib/services/context";
import { fail, toFailure } from "@/lib/services/result";
import { assertSlugAvailable, logActivity, setActiveRestaurant } from "@/lib/services/restaurants";

export async function switchRestaurantAction(restaurantId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in again.");
    const repo = await getRepo();
    const membership = await repo.getMembership(user.id, restaurantId);
    if (!membership) return fail("You don't have access to that restaurant.");
    await setActiveRestaurant(restaurantId);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateRestaurantAction(restaurantId: string, input: unknown) {
  try {
    const { repo, restaurant } = await requireRestaurantAccess(restaurantId, { owner: true });
    const values = restaurantUpdateSchema.parse(input);
    if (values.slug !== restaurant.slug) await assertSlugAvailable(repo, values.slug, restaurantId);
    const updated = await repo.updateRestaurant(restaurantId, values);
    revalidatePath("/dashboard", "layout");
    revalidatePath(`/m/${restaurant.slug}`, "layout");
    revalidatePath(`/m/${updated.slug}`, "layout");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function addMemberAction(restaurantId: string, input: unknown) {
  try {
    const { repo, plan, user } = await requireRestaurantAccess(restaurantId, { owner: true });
    const { email, role } = z.object({ email: emailSchema, role: z.enum(["editor", "owner"]) }).parse(input);
    const members = await repo.listMembers(restaurantId);
    if (members.length >= plan.limits.members) {
      throw new EntitlementError("Team members are available on the Business plan.", "business");
    }
    const res = await repo.addMemberByEmail(restaurantId, email, role === "owner" ? "editor" : role);
    if (res === "not_found") return fail("No MenuMint account uses that email yet. Ask them to sign up first.");
    if (res === "exists") return fail("That person is already on your team.");
    await logActivity(repo, restaurantId, user.id, "member_added", `Added ${res.email} as ${res.role}`);
    revalidatePath("/dashboard/settings");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}

export async function removeMemberAction(restaurantId: string, userId: string) {
  try {
    const { repo, restaurant, user } = await requireRestaurantAccess(restaurantId, { owner: true });
    if (userId === restaurant.ownerId) return fail("The restaurant owner can't be removed.");
    await repo.removeMember(restaurantId, userId);
    await logActivity(repo, restaurantId, user.id, "member_removed", "Removed a team member");
    revalidatePath("/dashboard/settings");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}
