import "server-only";
import { ZodError } from "zod";
import { AuthzError, EntitlementError } from "./context";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string>; upgrade?: string };

export function fail(error: string, extra: Partial<{ fieldErrors: Record<string, string>; upgrade: string }> = {}) {
  return { ok: false as const, error, ...extra };
}

/** Converts thrown errors into user-safe action results. */
export function toFailure(err: unknown) {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail(err.issues[0]?.message ?? "Invalid input", { fieldErrors });
  }
  if (err instanceof AuthzError) return fail(err.message);
  if (err instanceof EntitlementError) return fail(err.message, { upgrade: err.requiredPlan });
  if (err instanceof Error && err.message === "SLUG_TAKEN") {
    return fail("That link is already taken.", { fieldErrors: { slug: "That link is already taken." } });
  }
  // Next.js uses thrown errors for redirect()/notFound(): let them propagate.
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[action]", err);
  return fail("Something went wrong. Please try again.");
}
