import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Absolute origin for a set of request headers. Behind Render's proxy the
 * `Host` / `x-forwarded-host` headers carry the public domain while `req.url`
 * can point at the internal address (e.g. 0.0.0.0:10000), so redirects and
 * generated links must use this rather than the raw request URL.
 */
export function originFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : env.appUrl;
}

/**
 * Absolute origin of the current request, derived from the proxy headers.
 * Use this anywhere a server component needs to build an absolute URL (QR
 * codes, canonical links, share links) so it always matches the deployed
 * domain instead of a build-time default.
 */
export async function getRequestOrigin(): Promise<string> {
  return originFromHeaders(await headers());
}
