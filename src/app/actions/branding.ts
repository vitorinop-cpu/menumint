"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BrandingInput } from "@/lib/domain";
import { getTemplate } from "@/lib/templates";
import { brandingSchema } from "@/lib/validation";
import { requireRestaurantAccess } from "@/lib/services/context";
import { toFailure } from "@/lib/services/result";
import { enforceBranding, logActivity } from "@/lib/services/restaurants";

const mediaSchema = z.object({
  logoUrl: z.string().max(600).nullable(),
  coverUrl: z.string().max(600).nullable(),
});

function safeMedia(url: string | null) {
  if (!url) return null;
  return url.startsWith("/api/uploads/") || url.startsWith("/images/") || url.startsWith("https://") ? url : null;
}

export async function saveBrandingAction(
  restaurantId: string,
  input: unknown,
  media?: { logoUrl: string | null; coverUrl: string | null },
) {
  try {
    const { repo, plan, user, restaurant } = await requireRestaurantAccess(restaurantId);
    const requested = brandingSchema.parse(input) as BrandingInput;
    const current = (await repo.getBranding(restaurantId)) ?? { ...getTemplate("modern-bistro").branding };
    const enforced = enforceBranding(requested, current, plan);
    const saved = await repo.saveBranding(restaurantId, enforced);
    if (media) {
      const m = mediaSchema.parse(media);
      await repo.updateRestaurant(restaurantId, { logoUrl: safeMedia(m.logoUrl), coverUrl: safeMedia(m.coverUrl) });
    }
    await logActivity(repo, restaurantId, user.id, "branding_updated", "Updated menu branding");
    revalidatePath("/dashboard", "layout");
    revalidatePath(`/m/${restaurant.slug}`, "layout");
    const { restaurantId: _r, updatedAt: _u, ...data } = saved;
    return { ok: true as const, data };
  } catch (err) {
    return toFailure(err);
  }
}
