/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * This is intentionally dependency-free and runs per server instance. On a
 * single Render instance it is enough to blunt brute-force and scraping; if you
 * scale to multiple instances, move the bucket to Redis/Upstash for a shared
 * limit. Keys are never persisted and no IP is written to disk.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets (0 when allowed). */
  retryAfter: number;
}

/** Fixed-window limiter: `limit` requests per `windowMs` for `key`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { ok: false, limit, remaining: 0, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { ok: true, limit, remaining: limit - current.count, retryAfter: 0 };
}

/** Best-effort client identifier for a request (proxy headers, never stored). */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}
