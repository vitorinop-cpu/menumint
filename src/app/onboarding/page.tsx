import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { getRestaurantPlan } from "@/lib/services/context";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getTemplate } from "@/lib/templates";
import type { BrandingInput, OnboardingDraft } from "@/lib/domain";

export const metadata: Metadata = { title: "Set up your restaurant", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const repo = await getRepo();
  const [profile, restaurants, { plan }] = await Promise.all([
    repo.getProfile(user.id),
    repo.listRestaurantsForUser(user.id),
    getRestaurantPlan(user.id),
  ]);
  let draft: OnboardingDraft = profile?.onboarding ?? { step: 0, data: {} };
  let restaurant = null;
  let branding: BrandingInput = getTemplate("modern-bistro").branding;
  let qrCode = null;
  let menuPublished = false;

  if (draft.data.restaurantId) {
    const membership = await repo.getMembership(user.id, draft.data.restaurantId);
    if (membership) {
      restaurant = await repo.getRestaurant(draft.data.restaurantId);
      const b = await repo.getBranding(draft.data.restaurantId);
      if (b) {
        const { restaurantId: _r, updatedAt: _u, ...rest } = b;
        branding = rest;
      }
      if (draft.data.qrCodeId) qrCode = await repo.getQrCode(draft.data.qrCodeId);
      if (draft.data.menuId) menuPublished = (await repo.getMenu(draft.data.menuId))?.status === "published";
    } else {
      draft = { step: 0, data: {} };
    }
  }

  return (
    <OnboardingWizard
      userName={user.fullName}
      initialDraft={draft}
      initialRestaurant={restaurant}
      initialBranding={branding}
      initialQr={qrCode}
      initialPublished={menuPublished}
      plan={{ id: plan.id, name: plan.name, templates: plan.templates, branding: plan.branding, qr: plan.qr }}
      hasOtherRestaurants={restaurants.some((r) => r.id !== draft.data.restaurantId)}
    />
  );
}
