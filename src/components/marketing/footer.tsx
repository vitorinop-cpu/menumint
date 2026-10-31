import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#templates", label: "Templates" },
      { href: "/#qr", label: "QR codes" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Log in" },
      { href: "/m/saffron-sage", label: "Live demo menu" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[15px] leading-relaxed text-espresso-600">
              Beautiful digital menus for restaurants, cafés and bars — designed in your brand and shared with one simple QR code.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso-500">{c.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-espresso-600 transition-colors hover:text-terracotta-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-espresso/[0.08] pt-6 text-[13.5px] text-espresso-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MenuMint. All rights reserved.</p>
          <p>Made for the people who make the food.</p>
        </div>
      </div>
    </footer>
  );
}
