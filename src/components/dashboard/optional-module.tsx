import Link from "next/link";
import { Check } from "lucide-react";
import { PageHeader } from "./page-header";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { Badge } from "@/components/glass/primitives";

/** Honest placeholder for modules whose backend is not implemented yet. */
export function OptionalModule({
  title,
  icon,
  summary,
  planned,
}: {
  title: string;
  icon: React.ReactNode;
  summary: string;
  planned: string[];
}) {
  return (
    <div className="pb-10">
      <PageHeader eyebrow="Optional module" title={title} description={summary} />
      <GlassCard className="mx-auto max-w-2xl text-center" padding="lg">
        <div className="mx-auto grid size-16 place-items-center rounded-[20px] bg-lavender-soft text-lavender-ink [&_svg]:size-7">{icon}</div>
        <div className="mt-4 flex justify-center">
          <Badge tone="lavender">Not enabled</Badge>
        </div>
        <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-espresso">{title} isn&apos;t available yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-espresso-500">
          This module has no backend in this version of MenuMint, so nothing here is simulated. Your menus, QR codes and analytics work fully without it.
        </p>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {planned.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-espresso-600">
              <Check className="mt-0.5 size-4 shrink-0 text-espresso-400" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-espresso-500">Planned scope</p>
        <GlassButton asChild variant="glass" className="mt-6">
          <Link href="/dashboard/menus">Back to menus</Link>
        </GlassButton>
      </GlassCard>
    </div>
  );
}
