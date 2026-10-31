import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;
  // Supabase recovery links create a session first; demo links carry a one-time token.
  const user = token ? null : await getCurrentUser();
  if (!token && !user) {
    return (
      <AuthCard title="Link expired" subtitle="This password reset link is invalid or has expired.">
        <Link href="/forgot-password" className="font-semibold text-terracotta-ink hover:underline">
          Request a new link
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password" subtitle="Make it memorable — and unique to MenuMint.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
