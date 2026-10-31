import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { originFromHeaders } from "@/lib/origin";

/** Starts a fresh onboarding flow to add another restaurant (plan limits apply on submit). */
export async function GET(req: Request) {
  const origin = originFromHeaders(req.headers);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/onboarding", origin));
  const repo = await getRepo();
  await repo.updateProfile(user.id, { onboarding: { step: 0, data: {} } });
  return NextResponse.redirect(new URL("/onboarding", origin));
}
