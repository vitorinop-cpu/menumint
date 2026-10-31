import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/env";
import { localAuth } from "./local";
import { supabaseAuth } from "./supabase";
import { clerkAuth } from "./clerk";
import type { AuthAdapter } from "./types";

export function auth(): AuthAdapter {
  if (isClerkConfigured()) return clerkAuth;
  if (isSupabaseConfigured()) return supabaseAuth;
  return localAuth;
}

/** Per-request memoised current user. */
export const getCurrentUser = cache(async () => auth().getUser());

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
