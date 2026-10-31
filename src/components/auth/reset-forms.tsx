"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { forgotSchema, resetSchema } from "@/lib/validation";
import { requestResetAction, resetPasswordAction } from "@/app/actions/auth";
import { GlassButton } from "@/components/glass/glass-button";
import { Field, GlassInput } from "@/components/glass/glass-input";
import { GlassNotification } from "@/components/glass/glass-notification";
import { PasswordInput } from "./password-input";
import { HCAPTCHA_ENABLED, HCaptchaField } from "./hcaptcha-field";

export function ForgotPasswordForm({ demoMode }: { demoMode: boolean }) {
  const [state, setState] = React.useState<{ sent: boolean; devLink: string | null; error: string | null }>({
    sent: false,
    devLink: null,
    error: null,
  });
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    if (HCAPTCHA_ENABLED && !captchaToken) {
      setState({ sent: false, devLink: null, error: "Please complete the captcha challenge." });
      return;
    }
    startTransition(async () => {
      const res = await requestResetAction({ ...values, captchaToken: captchaToken ?? undefined });
      if (!res.ok) {
        setState({ sent: false, devLink: null, error: res.error });
        setCaptchaReset((n) => n + 1);
      } else setState({ sent: true, devLink: res.devLink, error: null });
    });
  });

  if (state.sent) {
    return (
      <div className="space-y-4">
        <GlassNotification tone="success" title="Check your email">
          If an account exists for {form.getValues("email")}, a reset link is on its way. It expires in 30 minutes.
        </GlassNotification>
        {demoMode && (
          <GlassNotification tone="demo" title="Demo mode: no email is sent">
            {state.devLink ? (
              <>
                Use this one-time link to continue:{" "}
                <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="break-all font-semibold text-terracotta-ink underline">
                  Reset password
                </Link>
              </>
            ) : (
              "No account matches that email in the local demo database."
            )}
          </GlassNotification>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {state.error && <GlassNotification tone="warning" title={state.error} />}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <GlassInput id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...form.register("email")} />
      </Field>
      <HCaptchaField onToken={setCaptchaToken} resetSignal={captchaReset} />
      <GlassButton type="submit" size="lg" className="w-full" loading={pending}>
        Send reset link
      </GlassButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await resetPasswordAction(values, token);
      if (res && !res.ok) setError(res.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <GlassNotification tone="warning" title={error} />}
      <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters with a letter and a number.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
        <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
      </Field>
      <GlassButton type="submit" size="lg" className="w-full" loading={pending}>
        Update password
      </GlassButton>
    </form>
  );
}
