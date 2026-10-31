import type { Metadata } from "next";
import { MenuComingSoon } from "@/components/public-menu/menu-coming-soon";

export const metadata: Metadata = { title: "Menu unavailable", robots: { index: false } };

export default function MenuUnavailablePage() {
  return <MenuComingSoon />;
}
