import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export function MenuComingSoon({ name }: { name?: string }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ivory px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-white shadow-[var(--shadow-soft)]">
          <UtensilsCrossed className="size-7 text-terracotta" aria-hidden />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-espresso">
          {name ? `${name}'s menu is on its way` : "This menu isn't available"}
        </h1>
        <p className="mt-3 text-espresso-500">
          {name
            ? "The team hasn't published a menu yet. Please ask a member of staff."
            : "This QR code or link is no longer active. Please ask a member of staff for the current menu."}
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-terracotta-ink underline-offset-4 hover:underline">
          Powered by MenuMint
        </Link>
      </div>
    </main>
  );
}
