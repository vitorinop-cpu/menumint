import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { SignUp } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/env";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage(props: PageProps<"/signup">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const sp = await props.searchParams;
  const plan = typeof sp.plan === "string" && sp.plan in PLANS && sp.plan !== "free" ? PLANS[sp.plan as keyof typeof PLANS] : null;

  if (isClerkConfigured()) {
    return <SignUp routing="hash" />;
  }

  return (
    <AuthCard
      title="Start your menu"
      subtitle={
        plan
          ? `Create your account, then upgrade to ${plan.name} from Billing whenever you're ready.`
          : "Free forever for one menu. No credit card required."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-terracotta-ink hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
