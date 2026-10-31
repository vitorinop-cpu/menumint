import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isClerkConfigured } from "@/lib/env";

export default function SignInPage() {
  // Clerk-only route; without Clerk the app uses its own /login form.
  if (!isClerkConfigured()) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
