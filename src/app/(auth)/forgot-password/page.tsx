import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/reset-forms";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
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
