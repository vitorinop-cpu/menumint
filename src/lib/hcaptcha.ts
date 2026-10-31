import "server-only";

/**
 * hCaptcha verification.
 *
 * Two modes coexist in MenuMint:
 *  - Clerk mode (production): Clerk renders the sign-in/sign-up forms and its
 *    own bot protection runs there. Enable hCaptcha in the Clerk Dashboard
 *    (Security → Bot protection) — no code is involved.
 *  - Custom forms (Supabase/local mode): our own login, sign-up and
 *    forgot-password forms verify tokens here, gated by env vars.
 *
 * When HCAPTCHA_SECRET_KEY is unset verification is skipped, so development and
 * self-hosted instances without keys keep working.
 */

const VERIFY_URL = "https://api.hcaptcha.com/siteverify";

export const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY ?? "";
export const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

/** True when the server is configured to enforce captcha checks. */
export function isCaptchaConfigured() {
  return Boolean(hcaptchaSecret && hcaptchaSiteKey);
}

export type CaptchaResult = { ok: true } | { ok: false; error: string };

/**
 * Verifies a token with hCaptcha's siteverify endpoint.
 * Fails closed when a secret is configured but the token is missing/invalid.
 */
export async function verifyCaptcha(token: string | undefined, remoteIp?: string): Promise<CaptchaResult> {
  if (!hcaptchaSecret) return { ok: true };
  if (!token) return { ok: false, error: "Please complete the captcha challenge." };

  try {
    const body = new URLSearchParams({ secret: hcaptchaSecret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    if (!res.ok) return { ok: false, error: "Captcha check failed. Please try again." };

    const data = (await res.json()) as { success?: boolean };
    if (data.success) return { ok: true };
    return { ok: false, error: "Captcha check failed. Please try again." };
  } catch {
    return { ok: false, error: "Could not reach the captcha service. Please try again." };
  }
}
