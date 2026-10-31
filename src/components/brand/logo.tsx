import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC6A6" />
          <stop offset="0.55" stopColor="#E97542" />
          <stop offset="1" stopColor="#C8572B" />
        </linearGradient>
        <linearGradient id={`${id}-hl`} x1="16" y1="1" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="9" y1="9" x2="23" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCF4E7" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9.5" fill={`url(#${id}-bg)`} />
      <rect x="1.5" y="1.5" width="29" height="15" rx="9" fill={`url(#${id}-hl)`} />
      <path d="M9.5 22.5C9.5 14.2 14.6 9 23 9c0 8.4-5.2 13.5-13.5 13.5Z" fill={`url(#${id}-leaf)`} />
      <path d="M9.8 22.2 18.6 13.4" stroke="#E97542" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 18h3.6M15.8 15.9h3" stroke="#E97542" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-xl", className)} aria-label="MenuMint home">
      <LogoMark className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-105" />
      <span className={cn("font-display text-[21px] font-semibold tracking-[-0.03em]", light ? "text-ivory" : "text-espresso")}>
        MenuMint
      </span>
    </Link>
  );
}
