"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Sparkles } from "lucide-react";
import { signInSchema } from "@/lib/validation";
import { signInAction } from "@/app/actions/auth";
import { GlassButton } from "@/components/glass/glass-button";
import { Field, GlassInput } from "@/components/glass/glass-input";
import { GlassNotification } from "@/components/glass/glass-notification";
import { PasswordInput } from "./password-input";

type Values = z.infer<typeof signInSchema>;

export function LoginForm({ next, demo, notice }: { next?: string; demo?: { email: string; password: string } | null; notice?: string | null }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<Values>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await signInAction(values, next);
      if (res && !res.ok) setError(res.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {notice && <GlassNotification tone="success" title={notice} />}
      {demo && (
        <GlassNotification
          tone="demo"
          title="Demo mode"
          action={
            <GlassButton
              type="button"
              size="xs"
              variant="dark"
              onClick={() => {
                form.setValue("email", demo.email, { shouldValidate: true });
                form.setValue("password", demo.password, { shouldValidate: true });
              }}
            >
              <Sparkles /> Use demo
            </GlassButton>
          }
        >
          Explore a sample restaurant: <span className="font-mono text-[12px]">{demo.email}</span>
        </GlassNotification>
      )}
      {error && <GlassNotification tone="warning" title={error} />}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <GlassInput
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
      </Field>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-[13px] font-medium text-espresso-600">
            Password
          </label>
          <Link href="/forgot-password" className="text-[13px] font-medium text-terracotta-ink hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...form.register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
            {errors.password.message}
          </p>
        )}
      </div>
      <GlassButton type="submit" size="lg" className="mt-2 w-full" loading={pending}>
        Log in
      </GlassButton>
    </form>
  );
}
