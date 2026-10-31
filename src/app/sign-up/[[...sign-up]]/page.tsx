import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isClerkConfigured } from "@/lib/env";

export default function SignUpPage() {
  // Clerk-only route; without Clerk the app uses its own /signup form.
  if (!isClerkConfigured()) redirect("/signup");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
