import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { isClerkConfigured } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const PROTECTED = ["/dashboard", "/onboarding", "/print"];

const isProtectedRoute = createRouteMatcher(PROTECTED.map((p) => `${p}(.*)`));

interface LimitRule {
  name: string;
  match: (pathname: string) => boolean;
  limit: number;
  windowMs: number;
}

// Per-instance request budgets. Clerk's own API calls (sign-in, sign-up) are
// served by Clerk directly, so brute-force protection there is handled by
// Clerk's instance settings; these limits cover our own routes.
const LIMIT_RULES: LimitRule[] = [
  {
    name: "auth-page",
    match: (p) => ["/login", "/signup", "/forgot-password", "/reset-password"].includes(p),
    limit: 60,
    windowMs: 60_000,
  },
  { name: "track", match: (p) => p.startsWith("/api/track"), limit: 120, windowMs: 60_000 },
  { name: "upload", match: (p) => p.startsWith("/api/upload"), limit: 20, windowMs: 60_000 },
  { name: "stripe", match: (p) => p.startsWith("/api/stripe"), limit: 120, windowMs: 60_000 },
  { name: "api", match: (p) => p.startsWith("/api/"), limit: 100, windowMs: 60_000 },
];

function enforceLimits(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const ip = clientKey(request.headers);

  for (const rule of LIMIT_RULES) {
    if (!rule.match(pathname)) continue;
    const result = rateLimit(`${rule.name}:${ip}`, rule.limit, rule.windowMs);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfter),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
    // Only the most specific rule applies.
    break;
  }
  return null;
}

export default clerkMiddleware(async (authFn, request) => {
  const { pathname, search } = request.nextUrl;

  const limited = enforceLimits(request);
  if (limited) return limited;

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
