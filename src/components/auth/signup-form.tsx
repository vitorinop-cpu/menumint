"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Check, MailCheck } from "lucide-react";
import { signUpSchema } from "@/lib/validation";
import { signUpAction } from "@/app/actions/auth";
import { GlassButton } from "@/components/glass/glass-button";
import { Field, GlassInput } from "@/components/glass/glass-input";
import { GlassNotification } from "@/components/glass/glass-notification";
import { PasswordInput } from "./password-input";
import { HCAPTCHA_ENABLED, HCaptchaField } from "./hcaptcha-field";
import { cn } from "@/lib/utils";

type Values = z.infer<typeof signUpSchema>;

const rules = [
  { test: (v: string) => v.length >= 8, label: "8+ characters" },
  { test: (v: string) => /[A-Za-z]/.test(v), label: "A letter" },
  { test: (v: string) => /\d/.test(v), label: "A number" },
];

export function SignupForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [confirmSent, setConfirmSent] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<Values>({ resolver: zodResolver(signUpSchema), defaultValues: { fullName: "", email: "", password: "" } });
  const { errors } = form.formState;
  const password = form.watch("password");

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    if (HCAPTCHA_ENABLED && !captchaToken) {
      setError("Please complete the captcha challenge.");
      return;
    }
    startTransition(async () => {
      const res = await signUpAction({ ...values, captchaToken: captchaToken ?? undefined });
      if (!res) return;
      if (!res.ok) {
        setError(res.error);
        setCaptchaReset((n) => n + 1);
      } else if ("needsConfirmation" in res && res.needsConfirmation) setConfirmSent(true);
    });
  });

  if (confirmSent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-mint-soft">
          <MailCheck className="size-6 text-mint-ink" aria-hidden />
        </div>
        <p className="mt-4 font-semibold text-espresso">Check your inbox</p>
        <p className="mt-1 text-sm text-espresso-500">We sent a confirmation link to {form.getValues("email")}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <GlassNotification tone="warning" title={error} />}
      <Field label="Your name" htmlFor="fullName" error={errors.fullName?.message}>
        <GlassInput id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-error" : undefined} {...form.register("fullName")} />
      </Field>
      <Field label="Work email" htmlFor="email" error={errors.email?.message}>
        <GlassInput id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...form.register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="password-rules" {...form.register("password")} />
      </Field>
      <ul id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]" aria-label="Password requirements">
        {rules.map((r) => {
          const ok = r.test(password ?? "");
          return (
            <li key={r.label} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-mint-ink" : "text-espresso-500")}>
              <span className={cn("grid size-4 place-items-center rounded-full transition-all", ok ? "scale-100 bg-mint-soft" : "scale-90 bg-espresso/[0.06]")}>
                <Check className={cn("size-2.5 transition-opacity", ok ? "opacity-100" : "opacity-0")} aria-hidden />
              </span>
              {r.label}
              <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
            </li>
          );
        })}
      </ul>
      <HCaptchaField onToken={setCaptchaToken} resetSignal={captchaReset} />
      <GlassButton type="submit" size="lg" className="mt-2 w-full" loading={pending}>
        Create account
      </GlassButton>
      <p className="text-center text-[12.5px] text-espresso-500">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline underline-offset-2 hover:text-espresso">Terms</a> and{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-espresso">Privacy Policy</a>.
      </p>
    </form>
  );
}
