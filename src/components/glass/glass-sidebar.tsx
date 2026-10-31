"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function GlassSidebar({ children, className, label = "Main" }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <aside className={cn("glass glass-rim flex flex-col rounded-[28px]", className)} aria-label={`${label} sidebar`}>
      {children}
    </aside>
  );
}

export function GlassSidebarItem({
  href,
  icon,
  label,
  active,
  badge,
  layoutId = "sidebar-active",
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: React.ReactNode;
  layoutId?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-[14px] px-3 text-[14px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-terracotta/50",
        active ? "text-espresso" : "text-espresso-500 hover:text-espresso",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-[14px] bg-white shadow-[0_1px_2px_rgb(36_27_24/0.06),0_6px_16px_-8px_rgb(36_27_24/0.18),inset_0_1px_0_white]"
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
        />
      )}
      <span
        className={cn(
          "relative z-10 grid size-7 place-items-center rounded-[9px] transition-all duration-300 [&_svg]:size-[17px]",
          active ? "bg-[linear-gradient(160deg,#FFC6A6,#E97542)] text-white shadow-[0_3px_8px_-2px_rgb(233_117_66/0.5)]" : "text-espresso-400 group-hover:text-espresso-600",
        )}
      >
        {icon}
      </span>
      <span className="relative z-10 flex-1 truncate">{label}</span>
      {badge && <span className="relative z-10">{badge}</span>}
    </Link>
  );
}
