import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { isClerkConfigured } from "@/lib/env";

const PROTECTED = ["/dashboard", "/onboarding", "/print"];

const isProtectedRoute = createRouteMatcher(PROTECTED.map((p) => `${p}(.*)`));

export default clerkMiddleware(async (authFn, request) => {
  const { pathname, search } = request.nextUrl;

  if (isClerkConfigured()) {
    if (isProtectedRoute(request)) {
      await authFn.protect();
    }
    return NextResponse.next();
  }

  // Supabase / local fallback (original behaviour).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  let signedIn: boolean;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    signedIn = Boolean(request.cookies.get("mm_session")?.value);
  }

  if (!signedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|api/uploads|api/stripe/webhook|favicon.ico|.*\\.(?:jpg|png|svg|webp|ico)$).*)"],
};