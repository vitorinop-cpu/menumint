"use client";

import * as React from "react";
import Script from "next/script";

interface HCaptchaApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaApi;
  }
}

/** Inlined at build time; empty string disables the widget entirely. */
export const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";
export const HCAPTCHA_ENABLED = Boolean(HCAPTCHA_SITE_KEY);

const SCRIPT_SRC = "https://js.hcaptcha.com/1/api.js?render=explicit";

/**
 * Explicit hCaptcha widget. Renders nothing unless NEXT_PUBLIC_HCAPTCHA_SITE_KEY
 * is set, so unconfigured environments behave exactly as before.
 *
 * `resetSignal` clears the challenge (and the parent's token) whenever it
 * changes — used after a failed submit so the token can be retried.
 */
export function HCaptchaField({
  onToken,
  resetSignal = 0,
  className,
}: {
  onToken: (token: string | null) => void;
  resetSignal?: number;
  className?: string;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const widgetId = React.useRef<string | null>(null);
  const tokenRef = React.useRef(onToken);

  React.useEffect(() => {
    tokenRef.current = onToken;
  }, [onToken]);

  const mount = React.useCallback(() => {
    const api = window.hcaptcha;
    const host = hostRef.current;
    if (!api || !host || widgetId.current || !HCAPTCHA_SITE_KEY) return;
    widgetId.current = api.render(host, {
      sitekey: HCAPTCHA_SITE_KEY,
      theme: "light",
      size: "normal",
      callback: (token: string) => tokenRef.current(token),
      "expired-callback": () => tokenRef.current(null),
      "error-callback": () => tokenRef.current(null),
    });
  }, []);

  // The script may already be loaded (another form on the page) when this
  // component mounts, in which case onLoad never fires.
  React.useEffect(() => {
    if (window.hcaptcha) mount();
  }, [mount]);

  const seenReset = React.useRef(resetSignal);
  React.useEffect(() => {
    if (seenReset.current === resetSignal) return;
    seenReset.current = resetSignal;
    if (widgetId.current && window.hcaptcha) window.hcaptcha.reset(widgetId.current);
    tokenRef.current(null);
  }, [resetSignal]);

  if (!HCAPTCHA_ENABLED) return null;

  return (
    <div className={className}>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onLoad={mount} />
      <div ref={hostRef} aria-label="hCaptcha challenge" />
      <p className="mt-2 text-[11.5px] leading-snug text-espresso-500">
        Protected by hCaptcha —{" "}
        <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Privacy
        </a>{" "}
        and{" "}
        <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Terms
        </a>
        .
      </p>
    </div>
  );
}
