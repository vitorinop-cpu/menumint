import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "MenuMint — Beautiful digital menus for restaurants",
    template: "%s · MenuMint",
  },
  description:
    "Create stunning digital menus, customise your restaurant's identity, and share everything with one simple QR code.",
  openGraph: {
    type: "website",
    siteName: "MenuMint",
    images: [{ url: "/images/hero/hero-table.jpg", width: 1536, height: 1024 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-espresso focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <Providers>{children}</Providers>
    </>
  );

  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh">
        {/* ClerkProvider requires only the publishable key; demo/Supabase-only installs run without it. */}
        {env.clerkPublishableKey ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}