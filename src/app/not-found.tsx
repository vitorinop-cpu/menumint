import Link from "next/link";
import { Aurora } from "@/components/brand/aurora";
import { Logo } from "@/components/brand/logo";
import { GlassButton } from "@/components/glass/glass-button";

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center">
      <Aurora intensity="soft" />
      <div className="relative">
        <Logo className="mb-10" />
        <p className="font-display text-[96px] font-medium leading-none tracking-[-0.05em] text-terracotta/80">404</p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-espresso">This page isn&apos;t on the menu</h1>
        <p className="mt-2 text-espresso-500">The link may be outdated, or the page has moved.</p>
        <GlassButton asChild className="mt-8">
          <Link href="/">Back to MenuMint</Link>
        </GlassButton>
      </div>
    </main>
  );
}
