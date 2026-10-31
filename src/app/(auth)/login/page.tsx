import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLoading } from "@/components/auth/auth-loading";
import { LoginForm } from "@/components/auth/login-form";
import { SignIn } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { isClerkConfigured, isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
  const notice = sp.signedOut ? "You've been signed out." : sp.error === "link" ? null : null;
  // Demo credentials are only revealed in local demo mode (no Supabase configured).
  const demo = isDemoMode() ? { email: "demo@menumint.app", password: "mint-demo-2026" } : null;

  if (isClerkConfigured()) {
    return (
      <Suspense fallback={<AuthLoading />}>
        <SignIn routing="hash" />
      </Suspense>
    );
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your menus, QR codes and branding."
      footer={
        <>
          New to MenuMint?{" "}
          <Link href="/signup" className="font-semibold text-terracotta-ink hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {sp.error === "link" && (
        <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          That link has expired. Please try again.
        </p>
      )}
      <LoginForm next={next} demo={demo} notice={notice} />
    </AuthCard>
  );
}
