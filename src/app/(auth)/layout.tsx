import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { Aurora } from "@/components/brand/aurora";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col overflow-hidden px-5 py-6 sm:px-10">
        <Aurora intensity="soft" />
        <div className="relative z-10">
          <Logo />
        </div>
        <main id="main" className="relative z-10 flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
        <p className="relative z-10 text-center text-xs text-espresso-500">© 2026 MenuMint · Crafted for hospitality</p>
      </div>
      <div className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-[32px]">
          <Image
            src="/images/hero/hero-table.jpg"
            alt=""
            fill
            priority
            sizes="55vw"
            className="object-cover object-[30%_50%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(36_27_24/0.55))]" />
          <figure className="glass absolute inset-x-8 bottom-8 rounded-[24px] p-6 text-espresso">
            <blockquote className="font-display text-[22px] leading-snug tracking-[-0.01em]">
              “Your menu is the first conversation you have with a guest. Make it a beautiful one.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-espresso-600">The MenuMint philosophy</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
