import type { Metadata } from "next";
import { BrandingSection } from "@/components/marketing/branding-section";
import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { Pricing } from "@/components/marketing/pricing";
import { QrSection } from "@/components/marketing/qr-section";
import { TemplateGallery } from "@/components/marketing/template-gallery";
import { TryIt } from "@/components/marketing/try-it";

export const metadata: Metadata = {
  title: { absolute: "MenuMint — Beautiful digital menus for restaurants" },
  description:
    "Create stunning digital menus, customize your restaurant's identity, and share everything with one simple QR code. Free to start.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MenuMint — Beautiful menus. Happier customers.",
    description: "Create stunning digital menus, customize your restaurant's identity, and share everything with one simple QR code.",
    url: "/",
    type: "website",
    siteName: "MenuMint",
    images: [{ url: "/images/hero/hero-table.jpg", width: 1536, height: 1024, alt: "A sunlit table of Mediterranean dishes" }],
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <TryIt />
      <TemplateGallery />
      <QrSection />
      <BrandingSection />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
