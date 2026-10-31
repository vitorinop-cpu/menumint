import { GlassNavbar } from "@/components/marketing/glass-navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-ivory">
      <GlassNavbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
