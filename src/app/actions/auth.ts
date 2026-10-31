"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { forgotSchema, resetSchema, signInSchema, signUpSchema } from "@/lib/validation";
import { fail, toFailure } from "@/lib/services/result";
import { getRepo } from "@/lib/data";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/hcaptcha";

/** Fail fast when an action is hammered from one client. */
async function throttle(action: string, limit = 10, windowMs = 60_000) {
  const h = await headers();
  const result = rateLimit(`${action}:${clientKey(h)}`, limit, windowMs);
  if (!result.ok) return fail(`Too many attempts. Try again in ${result.retryAfter}s.`);
  return null;
}

/** Verifies an hCaptcha token when a secret is configured. */
async function captchaCheck(token: string | undefined) {
  const h = await headers();
  const result = await verifyCaptcha(token, clientKey(h));
  return result.ok ? null : fail(result.error);
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signUpAction(input: unknown) {
  const limited = await throttle("sign-up", 5);
  if (limited) return limited;
  let needsConfirmation = false;
  try {
    const { captchaToken, ...values } = signUpSchema.parse(input);
    const blocked = await captchaCheck(captchaToken);
    if (blocked) return blocked;
    const res = await auth().signUp(values);
    if (!res.ok) return fail(res.error, { fieldErrors: { email: res.error } });
    needsConfirmation = res.needsConfirmation;
  } catch (err) {
    return toFailure(err);
  }
  if (needsConfirmation) return { ok: true as const, needsConfirmation: true };
  redirect("/onboarding");
}

export async function signInAction(input: unknown, next?: string) {
  const limited = await throttle("sign-in", 10);
  if (limited) return limited;
  try {
    const { captchaToken, ...values } = signInSchema.parse(input);
    const blocked = await captchaCheck(captchaToken);
    if (blocked) return blocked;
    const res = await auth().signIn(values);
    if (!res.ok) return fail(res.error);
  } catch (err) {
    return toFailure(err);
  }
  redirect(safeNext(next));
}

export async function signOutAction() {
  await auth().signOut();
  redirect("/login?signedOut=1");
}

export async function requestResetAction(input: unknown) {
  const limited = await throttle("password-reset-request", 5);
  if (limited) return limited;
  try {
    const { email, captchaToken } = forgotSchema.parse(input);
    const blocked = await captchaCheck(captchaToken);
    if (blocked) return blocked;
    const res = await auth().requestPasswordReset(email, await origin());
    if (!res.ok) return fail(res.error);
    return { ok: true as const, devLink: res.devLink ?? null };
  } catch (err) {
    return toFailure(err);
  }
}

export async function resetPasswordAction(input: unknown, token: string | null) {
  const limited = await throttle("password-reset", 10);
  if (limited) return limited;
  try {
    const { password } = resetSchema.parse(input);
    const res = await auth().updatePassword({ password, token });
    if (!res.ok) return fail(res.error);
  } catch (err) {
    return toFailure(err);
  }
  redirect("/dashboard?passwordUpdated=1");
}

export async function updateProfileAction(input: unknown) {
  try {
    const user = await auth().getUser();
    if (!user) return fail("Please sign in again.");
    const name = typeof input === "object" && input && "fullName" in input ? String(input.fullName).trim() : "";
    if (name.length < 2 || name.length > 80) return fail("Enter a name between 2 and 80 characters.");
    const repo = await getRepo();
    await repo.updateProfile(user.id, { fullName: name });
    return { ok: true as const };
  } catch (err) {
    return toFailure(err);
  }
}
