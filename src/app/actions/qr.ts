"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/lib/data";
import type { QrStyle } from "@/lib/domain";
import type { PlanDefinition } from "@/lib/plans";
import { contrastRatio, luminance } from "@/lib/utils";
import { qrInputSchema } from "@/lib/validation";
import { EntitlementError, requireRestaurantAccess } from "@/lib/services/context";
import { fail, toFailure } from "@/lib/services/result";
import { logActivity } from "@/lib/services/restaurants";

const BASIC_STYLE: Pick<QrStyle, "fg" | "bg" | "dotStyle" | "cornerStyle" | "logo"> = {
  fg: "#000000",
  bg: "#FFFFFF",
  dotStyle: "square",
  cornerStyle: "square",
  logo: false,
};

/** Server-side QR entitlement + readability enforcement. */
function enforceQrStyle(style: QrStyle, plan: PlanDefinition): QrStyle {
  let next = { ...style };
  if (plan.qr === "basic") {
    const customised =
      style.fg.toLowerCase() !== BASIC_STYLE.fg ||
      style.bg.toLowerCase() !== BASIC_STYLE.bg.toLowerCase() ||
      style.dotStyle !== "square" ||
      style.cornerStyle !== "square" ||
      style.logo;
    if (customised) throw new EntitlementError("Coloured and styled QR codes are available on Starter and above.", "starter");
    next = { ...next, ...BASIC_STYLE };
  }
  if (plan.qr === "color" && (style.dotStyle !== "square" || style.cornerStyle !== "square" || style.logo)) {
    throw new EntitlementError("QR styles and logos are available on the Pro plan.", "pro");
  }
  if (contrastRatio(next.fg, next.bg) < 4) {
    throw new Error("LOW_CONTRAST");
  }
  if (luminance(next.fg) > luminance(next.bg)) {
    throw new Error("INVERTED");
  }
  return next;
}

function qrFailure(err: unknown) {
  if (err instanceof Error && err.message === "LOW_CONTRAST") {
    return fail("Those colours are too similar for phones to scan reliably. Increase the contrast (minimum 4:1).");
  }
  if (err instanceof Error && err.message === "INVERTED") {
    return fail("Use a darker foreground than background — many scanners can't read inverted codes.");
  }
  return toFailure(err);
}

async function validateMenuTarget(restaurantId: string, menuId: string | null, repo: Awaited<ReturnType<typeof requireRestaurantAccess>>["repo"]) {
  if (!menuId) return;
  const menu = await repo.getMenu(menuId);
  if (!menu || menu.restaurantId !== restaurantId) throw new Error("Menu not found");
}

export async function createQrAction(restaurantId: string, input: unknown) {
  try {
    const { repo, plan, user } = await requireRestaurantAccess(restaurantId);
    const values = qrInputSchema.parse(input);
    await validateMenuTarget(restaurantId, values.menuId, repo);
    const style = enforceQrStyle(values.style, plan);
    const qr = await repo.createQrCode(restaurantId, { name: values.name, menuId: values.menuId, style });
    await logActivity(repo, restaurantId, user.id, "qr_created", `Created QR code “${qr.name}”`);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, data: qr };
  } catch (err) {
    return qrFailure(err);
  }
}

export async function updateQrAction(qrId: string, input: unknown) {
  try {
    const values = qrInputSchema.parse(input);
    const existing = await (await getRepo()).getQrCode(qrId);
    if (!existing) return fail("QR code not found.");
    const { repo, plan, user } = await requireRestaurantAccess(existing.restaurantId);
    await validateMenuTarget(existing.restaurantId, values.menuId, repo);
    const style = enforceQrStyle(values.style, plan);
    const qr = await repo.updateQrCode(qrId, { name: values.name, menuId: values.menuId, style });
    await logActivity(repo, existing.restaurantId, user.id, "qr_updated", `Updated QR code “${qr.name}”`);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, data: qr };
  } catch (err) {
    return qrFailure(err);
  }
}

export async function archiveQrAction(qrId: string) {
  try {
    const existing = await (await getRepo()).getQrCode(qrId);
    if (!existing) return fail("QR code not found.");
    const { repo } = await requireRestaurantAccess(existing.restaurantId);
    await repo.updateQrCode(qrId, { archived: true });
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}
