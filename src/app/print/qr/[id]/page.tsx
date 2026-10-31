import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { buildQrSvg } from "@/lib/qr";
import { PrintButton } from "@/components/qr/print-button";

export const metadata: Metadata = { title: "Print QR cards", robots: { index: false } };

/** Print-ready A4/Letter sheet with four cut-out table cards. */
export default async function PrintQrPage(props: PageProps<"/print/qr/[id]">) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) notFound();
  const repo = await getRepo();
  const qr = await repo.getQrCode(id);
  if (!qr || !(await repo.getMembership(user.id, qr.restaurantId))) notFound();
  const restaurant = await repo.getRestaurant(qr.restaurantId);
  if (!restaurant) notFound();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/q/${qr.code}`;
  // Logos are omitted on the print sheet unless inlined; keep it maximally scannable.
  const svg = buildQrSvg({ text: url, style: { ...qr.style, logo: false }, size: 512 }).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');

  return (
    <div className="min-h-dvh bg-[#eee] print:bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 bg-espresso px-5 py-3 text-ivory">
        <p className="text-sm">
          <strong>{qr.name}</strong> — 4 table cards per sheet. Cut along the dashed lines.
        </p>
        <PrintButton />
      </div>
      <div className="mx-auto my-8 grid aspect-[210/297] w-[min(100%,210mm)] grid-cols-2 grid-rows-2 bg-white shadow-xl print:my-0 print:shadow-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center border border-dashed border-black/20 p-[8%] text-center" style={{ color: qr.style.fg }}>
            <p className="font-display text-[clamp(14px,2.6vw,26px)] font-semibold leading-tight tracking-tight">{restaurant.name}</p>
            <p className="mt-1 text-[clamp(9px,1.4vw,13px)] uppercase tracking-[0.18em] opacity-70">{qr.style.frameLabel || "Scan for menu"}</p>
            <div className="mt-[6%] w-[72%] rounded-lg p-[3%]" style={{ background: qr.style.bg }} dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-[5%] break-all font-mono text-[clamp(7px,1.1vw,11px)] opacity-60">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
