import type { Metadata } from "next";
import { getRestaurantContext } from "@/lib/services/context";
import { getRepo } from "@/lib/data";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { restaurant, user, role, plan } = await getRestaurantContext();
  const repo = await getRepo();
  const members = await repo.listMembers(restaurant.id);
  return (
    <SettingsView
      restaurant={restaurant}
      user={user}
      isOwner={role === "owner"}
      members={members}
      memberLimit={plan.limits.members}
      planName={plan.name}
    />
  );
}
