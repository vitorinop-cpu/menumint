import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/reset-forms";
import { isClerkConfigured, isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  // Clerk owns the reset flow: its <SignIn> component renders the "forgot
  // password" steps and sends the reset email. Our custom form would be a
  // no-op here, so send people to the sign-in panel instead.
  if (isClerkConfigured()) redirect("/login");

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email you use for MenuMint and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-semibold text-terracotta-ink hover:underline">
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm demoMode={isDemoMode()} />
    </AuthCard>
  );
}
