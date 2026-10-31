import "server-only";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/env";
import { localRepo } from "./local/repo";
import type { Repo } from "./repo";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseRepo } from "./supabase/repo";

/** Repo bound to the signed-in user (RLS enforced in Supabase mode). */
export async function getRepo(): Promise<Repo> {
  // No Supabase: persist locally (covers demo mode and Clerk-only mode).
  if (!isSupabaseConfigured()) return localRepo;
  // Clerk provides auth identity; Supabase RLS keys off Supabase Auth, so use
  // the service-role client and rely on app-level authorization (services).
  if (isClerkConfigured()) return createSupabaseRepo(createSupabaseAdminClient());
  return createSupabaseRepo(await createSupabaseServerClient());
}

/**
 * Privileged repo for trusted server-only work: public published content,
 * anonymous analytics ingestion and Stripe webhooks. Never pass user input
 * through without validation.
 */
export function getSystemRepo(): Repo {
  if (!isSupabaseConfigured()) return localRepo;
  return createSupabaseRepo(createSupabaseAdminClient());
}

export type { Repo } from "./repo";
