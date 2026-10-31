// Central place for environment-derived feature flags. Safe to import on the server.
// Only NEXT_PUBLIC_* values are ever referenced from client bundles.

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isClerkConfigured() {
  return Boolean(env.clerkPublishableKey && env.clerkSecretKey);
}

/** Demo mode = no Supabase AND no Clerk. Data is persisted locally in ./.data (development only). */
export function isDemoMode() {
  return !isSupabaseConfigured() && !isClerkConfigured();
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function demoPlanSwitcherEnabled() {
  return isDemoMode() && process.env.DEMO_PLAN_SWITCHER !== "false";
}

export function stripePriceFor(plan: "starter" | "pro" | "business") {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS,
  } as const;
  return map[plan] ?? "";
}
