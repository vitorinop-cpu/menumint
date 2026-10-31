import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";
import { originFromHeaders } from "@/lib/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Supabase email-link callback (sign-up confirmation and password recovery). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = new URL(originFromHeaders(req.headers));
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (isDemoMode()) return NextResponse.redirect(new URL(safeNext, origin));
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
