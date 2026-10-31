import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";

/** Starts a fresh onboarding flow to add another restaurant (plan limits apply on submit). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/onboarding", req.url));
  const repo = await getRepo();
  await repo.updateProfile(user.id, { onboarding: { step: 0, data: {} } });
  return NextResponse.redirect(new URL("/onboarding", req.url));
}
