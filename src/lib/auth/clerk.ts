import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { mutate, readDb } from "@/lib/data/local/store";
import type { SessionUser } from "@/lib/domain";
import type { AuthAdapter } from "./types";

async function clerkProfileFromSupabase(clerkUserId: string): Promise<SessionUser | null> {
  const client = createSupabaseAdminClient();
  const { data: existing } = await client
    .from("profiles")
    .select("id, email, full_name")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existing) {
    return { id: existing.id as string, email: (existing.email as string) ?? "", fullName: (existing.full_name as string) ?? "" };
  }

  // First sign-in: fetch Clerk user and create a profile row.
  const clerk = await clerkClient();
  const cu = await clerk.users.getUser(clerkUserId);
  const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
  const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || "";
  const id = randomUUID();
  const ts = new Date().toISOString();

  const { error } = await client.from("profiles").insert({
    id,
    email,
    full_name: fullName,
    clerk_user_id: clerkUserId,
    created_at: ts,
  });
  if (error) return null;

  await client.from("subscriptions").insert({
    user_id: id,
    plan: "free",
    status: "none",
    source: "default",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
    cancel_at_period_end: false,
    updated_at: ts,
  });

  return { id, email, fullName };
}

async function clerkProfileFromLocal(clerkUserId: string): Promise<SessionUser | null> {
  const db = await readDb();
  const p = db.profiles.find((x) => x.id === clerkUserId);
  if (p) return { id: p.id, email: p.email, fullName: p.fullName };

  const clerk = await clerkClient();
  const cu = await clerk.users.getUser(clerkUserId);
  const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
  const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || "";
  const ts = new Date().toISOString();

  await mutate((d) => {
    d.profiles.push({ id: clerkUserId, email, fullName, onboarding: null, createdAt: ts });
    d.subscriptions.push({
      userId: clerkUserId,
      plan: "free",
      status: "none",
      source: "default",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      updatedAt: ts,
    });
  });
  return { id: clerkUserId, email, fullName };
}

export const clerkAuth: AuthAdapter = {
  async getUser() {
    const { userId } = await auth();
    if (!userId) return null;
    if (isSupabaseConfigured()) return clerkProfileFromSupabase(userId);
    return clerkProfileFromLocal(userId);
  },

  async signUp() {
    // Clerk handles sign-up via its components; nothing to do here.
    return { ok: true, needsConfirmation: false };
  },

  async signIn() {
    return { ok: true };
  },

  async signOut() {
    // Clerk manages its own session cookie; server-side sign-out is a no-op.
  },

  async requestPasswordReset() {
    // Clerk provides password reset flows out of the box.
    return { ok: true };
  },

  async updatePassword() {
    return { ok: true };
  },
};