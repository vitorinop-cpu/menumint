"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Printer,
  QrCode,
  Save,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import type { QrCode as QrCodeT, QrStyle } from "@/lib/domain";
import type { QrLevel } from "@/lib/plans";
import { checkQrReadability } from "@/lib/qr";
import { downloadQrPng, downloadQrSvg, toDataUrl, verifyQrScans } from "@/lib/qr-client";
import { cn, slugify } from "@/lib/utils";
import { useOrigin } from "@/lib/hooks";
import { archiveQrAction, createQrAction, updateQrAction } from "@/app/actions/qr";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";
import { Field, GlassInput, GlassSelect } from "@/components/glass/glass-input";
import { ColorField, GlassSwitch, PlanLock } from "@/components/glass/primitives";
import { Segmented } from "@/components/glass/glass-tabs";
import { GlassModal } from "@/components/glass/glass-modal";
import { GlassNotification } from "@/components/glass/glass-notification";
import { QrPreview } from "./qr-preview";

interface MenuOption {
  id: string;
  name: string;
  slug: string;
  published: boolean;
}

const PRESETS: { label: string; fg: string; bg: string }[] = [
  { label: "Classic", fg: "#000000", bg: "#FFFFFF" },
  { label: "Espresso", fg: "#241B18", bg: "#FFF9F2" },
  { label: "Terracotta", fg: "#9A3F1C", bg: "#FFF9F2" },
  { label: "Forest", fg: "#1F4D3A", bg: "#F4FAF6" },
  { label: "Ocean", fg: "#123E52", bg: "#F2F8FA" },
  { label: "Plum", fg: "#3E2A6E", bg: "#F7F4FF" },
];

const DEFAULT_STYLE: QrStyle = { fg: "#000000", bg: "#FFFFFF", dotStyle: "square", cornerStyle: "square", logo: false, frameLabel: "Scan for menu" };

export function QrStudio({
  restaurant,
  initialCodes,
  menus,
  scans,
  qrLevel,
  planName,
  initialSelected,
}: {
  restaurant: { id: string; name: string; slug: string; logoUrl: string | null };
  initialCodes: QrCodeT[];
  menus: MenuOption[];
  scans: Record<string, number>;
  qrLevel: QrLevel;
  planName: string;
  initialSelected: string | null;
}) {
  const router = useRouter();
  const [codes, setCodes] = React.useState(initialCodes);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialCodes.find((c) => c.id === initialSelected)?.id ?? initialCodes[0]?.id ?? null,
  );
  const selected = codes.find((c) => c.id === selectedId) ?? null;
  const [draft, setDraft] = React.useState<QrCodeT | null>(selected);
  const [draftFor, setDraftFor] = React.useState(selected);
  if (draftFor !== selected) {
    // Reset the working copy when another code is selected or saved.
    setDraftFor(selected);
    setDraft(selected);
  }
  const origin = useOrigin();
  const [logoData, setLogoData] = React.useState<string | null>(null);
  const [scanResult, setScanResult] = React.useState<{ sig: string; ok: boolean } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  React.useEffect(() => {
    if (!restaurant.logoUrl) return;
    void toDataUrl(restaurant.logoUrl).then(setLogoData);
  }, [restaurant.logoUrl]);

  const url = draft && origin ? `${origin}/q/${draft.code}` : "";
  const style = draft?.style ?? DEFAULT_STYLE;
  const readability = checkQrReadability(style);
  const logoHref = style.logo ? logoData : null;
  const dirty = Boolean(draft && selected && JSON.stringify(draft) !== JSON.stringify(selected));
  const scanSig = JSON.stringify([url, style, logoHref]);
  const scanCheck = !scanResult || scanResult.sig !== scanSig ? "checking" : scanResult.ok ? "pass" : "fail";

  // Decode the rendered code with jsQR whenever it changes, to prove it scans.
  React.useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const ok = await verifyQrScans({ text: url, style, logoHref });
      if (!cancelled) setScanResult({ sig: JSON.stringify([url, style, logoHref]), ok });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [url, style, logoHref]);

  const setStyle = (patch: Partial<QrStyle>) => setDraft((d) => (d ? { ...d, style: { ...d.style, ...patch } } : d));
  const colorLocked = qrLevel === "basic";
  const styleLocked = qrLevel !== "full";
  const filename = draft ? `${restaurant.slug}-${slugify(draft.name) || "qr"}` : "qr";

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await updateQrAction(draft.id, { name: draft.name, menuId: draft.menuId, style: draft.style });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCodes((cs) => cs.map((c) => (c.id === res.data.id ? res.data : c)));
      toast.success("QR code saved", { description: "Printed codes pick up destination changes instantly." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const destination = (menuId: string | null) => {
    if (!menuId) return `Main menu · /m/${restaurant.slug}`;
    const m = menus.find((x) => x.id === menuId);
    return m ? `${m.name}${m.published ? "" : " (not published)"}` : "Removed menu";
  };

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="QR Studio"
        title="QR codes"
        description="Every code uses a permanent link, so you can change menus without reprinting."
        actions={
          <GlassButton onClick={() => setNewOpen(true)}>
            <Plus /> New QR code
          </GlassButton>
        }
      />

      {codes.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<QrCode />}
            title="No QR codes yet"
            description="Create one for your tables, windows or takeaway bags."
            action={
              <GlassButton onClick={() => setNewOpen(true)}>
                <Plus /> Create QR code
              </GlassButton>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ul className="space-y-2" aria-label="QR codes">
            {codes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (dirty && !window.confirm("Discard unsaved changes to this QR code?")) return;
                    setSelectedId(c.id);
                  }}
                  aria-current={c.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-all duration-500 ease-[var(--ease-spring)]",
                    c.id === selectedId ? "glass-strong border-terracotta/30 shadow-[var(--shadow-lift)]" : "glass border-transparent hover:-translate-y-0.5",
                  )}
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-[var(--shadow-soft)]">
                    {origin && <QrPreview text={`${origin}/q/${c.code}`} style={c.style} label="" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-espresso">{c.name}</span>
                    <span className="block truncate text-xs text-espresso-500">{destination(c.menuId)}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-lavender-ink">
                      <ScanLine className="size-3" aria-hidden /> {scans[c.id] ?? 0} scans · 30d
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {draft && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <GlassCard tone="strong" className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="qr-name">
                    <GlassInput id="qr-name" value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </Field>
                  <Field label="Opens" htmlFor="qr-dest" hint="Change any time — the printed code stays the same.">
                    <GlassSelect id="qr-dest" value={draft.menuId ?? ""} onChange={(e) => setDraft({ ...draft, menuId: e.target.value || null })}>
                      <option value="">Main menu (first published)</option>
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                          {m.published ? "" : " — not published"}
                        </option>
                      ))}
                    </GlassSelect>
                  </Field>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[13px] font-medium text-espresso-600">Colours</span>
                    {colorLocked && <PlanLock plan="Starter" />}
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        disabled={colorLocked && p.label !== "Classic"}
                        onClick={() => setStyle({ fg: p.fg, bg: p.bg })}
                        aria-pressed={style.fg.toLowerCase() === p.fg.toLowerCase() && style.bg.toLowerCase() === p.bg.toLowerCase()}
                        className="flex items-center gap-2 rounded-full border border-espresso/10 bg-white/70 py-1 pl-1 pr-3 text-[13px] font-medium text-espresso-600 transition hover:bg-white disabled:opacity-40 aria-pressed:border-terracotta aria-pressed:text-espresso"
                      >
                        <span className="flex size-6 overflow-hidden rounded-full ring-1 ring-black/10" aria-hidden>
                          <span className="w-1/2" style={{ background: p.fg }} />
                          <span className="w-1/2" style={{ background: p.bg }} />
                        </span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField id="qr-fg" label="Foreground" value={style.fg} onChange={(v) => setStyle({ fg: v })} disabled={colorLocked} />
                    <ColorField id="qr-bg" label="Background" value={style.bg} onChange={(v) => setStyle({ bg: v })} disabled={colorLocked} />
                  </div>
                </div>

                <div className={cn("grid gap-4 sm:grid-cols-2", styleLocked && "opacity-60")}>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[13px] font-medium text-espresso-600">Dot style</span>
                      {styleLocked && <PlanLock plan="Pro" />}
                    </div>
                    <Segmented id="qr-dots" label="Dot style" disabled={styleLocked} value={style.dotStyle} onChange={(v) => setStyle({ dotStyle: v })} options={[{ value: "square", label: "Square" }, { value: "rounded", label: "Rounded" }, { value: "dots", label: "Dots" }]} />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[13px] font-medium text-espresso-600">Corner style</span>
                      {styleLocked && <PlanLock plan="Pro" />}
                    </div>
                    <Segmented id="qr-corners" label="Corner style" disabled={styleLocked} value={style.cornerStyle} onChange={(v) => setStyle({ cornerStyle: v })} options={[{ value: "square", label: "Square" }, { value: "rounded", label: "Rounded" }, { value: "circle", label: "Circle" }]} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={cn(styleLocked && "opacity-60")}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[13px] font-medium text-espresso-600">Restaurant logo in centre</span>
                      {styleLocked && <PlanLock plan="Pro" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <GlassSwitch checked={style.logo} onCheckedChange={(v) => setStyle({ logo: v })} disabled={styleLocked || !restaurant.logoUrl} label="Show logo" />
                      <span className="text-[13px] text-espresso-500">
                        {restaurant.logoUrl ? "Uses high error correction" : (
                          <>
                            <Link href="/dashboard/branding" className="font-medium text-terracotta-ink underline">
                              Upload a logo
                            </Link>{" "}
                            first
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <Field label="Frame label (print)" htmlFor="qr-label">
                    <GlassInput id="qr-label" value={style.frameLabel} maxLength={32} onChange={(e) => setStyle({ frameLabel: e.target.value })} />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-espresso/[0.07] pt-5">
                  <GlassButton
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm(`Archive “${draft.name}”? Printed copies will show a “menu unavailable” page.`)) return;
                      const res = await archiveQrAction(draft.id);
                      if (!res.ok) return toast.error(res.error);
                      const rest = codes.filter((c) => c.id !== draft.id);
                      setCodes(rest);
                      setSelectedId(rest[0]?.id ?? null);
                      toast.success("QR code archived");
                    }}
                  >
                    <Archive /> Archive
                  </GlassButton>
                  <div className="flex gap-2">
                    <GlassButton variant="ghost" disabled={!dirty} onClick={() => setDraft(selected)}>
                      Discard
                    </GlassButton>
                    <GlassButton onClick={() => void save()} loading={saving} disabled={!dirty || !readability.ok || !draft.name.trim()}>
                      {!saving && <Save />} Save changes
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>

              <div className="space-y-4">
                <GlassCard className="flex flex-col items-center">
                  <div className="w-full max-w-[260px] rounded-[22px] bg-white p-4 shadow-[var(--shadow-lift)]">
                    {url ? <QrPreview text={url} style={style} logoHref={logoHref} frame label={`QR code for ${url}`} /> : <div className="skeleton aspect-square" />}
                  </div>
                  <div className="mt-4 w-full space-y-2" aria-live="polite">
                    <ReadabilityRow ok={readability.contrast >= 4} label={`Contrast ${readability.contrast.toFixed(1)}:1`} detail={readability.contrast >= 7 ? "Excellent" : readability.contrast >= 4 ? "Good" : "Too low"} />
                    {readability.issues.slice(readability.contrast < 4 ? 1 : 0).map((i) => (
                      <ReadabilityRow key={i} ok={false} label={i} />
                    ))}
                    <ReadabilityRow
                      ok={scanCheck === "pass"}
                      pending={scanCheck === "checking"}
                      label={scanCheck === "pass" ? "Scan test passed" : scanCheck === "fail" ? "Scan test failed" : "Testing scan…"}
                      detail={scanCheck === "pass" ? "Decoded successfully" : scanCheck === "fail" ? "Try more contrast or no logo" : undefined}
                    />
                  </div>
                </GlassCard>
                <GlassCard className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <GlassButton
                      variant="dark"
                      size="sm"
                      disabled={!readability.ok}
                      onClick={() => downloadQrPng({ text: url, style, logoHref, frame: false }, `${filename}.png`).catch(() => toast.error("PNG export failed"))}
                    >
                      <Download /> PNG
                    </GlassButton>
                    <GlassButton variant="glass" size="sm" disabled={!readability.ok} onClick={() => downloadQrSvg({ text: url, style, logoHref, frame: false }, `${filename}.svg`)}>
                      <Download /> SVG
                    </GlassButton>
                  </div>
                  <GlassButton
                    variant="glass"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (dirty) toast.info("Printing the last saved version — save first to include your changes.");
                      window.open(`/print/qr/${draft.id}`, "_blank");
                    }}
                  >
                    <Printer /> Print-ready table cards
                  </GlassButton>
                  <div className="flex items-center gap-2 rounded-xl bg-espresso/[0.04] px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-espresso-600">{url.replace(/^https?:\/\//, "")}</span>
                    <button type="button" aria-label="Copy QR link" className="grid size-7 place-items-center rounded-lg hover:bg-white" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))}>
                      <Copy className="size-3.5" />
                    </button>
                    <a href={`/q/${draft.code}?preview=1`} target="_blank" rel="noreferrer" aria-label="Open link (not counted as a scan)" className="grid size-7 place-items-center rounded-lg hover:bg-white">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <p className="text-[12px] leading-snug text-espresso-500">
                    <strong className="font-semibold text-espresso-600">Scan to preview:</strong> point your phone camera at the code above. Opening the link here won&apos;t count as a scan.
                  </p>
                  {qrLevel !== "full" && (
                    <GlassNotification tone="info" title={`${planName} plan`} className="mt-2">
                      <Link href="/dashboard/billing" className="font-semibold underline">
                        Upgrade
                      </Link>{" "}
                      for {qrLevel === "basic" ? "colours, styles and logos" : "dot styles and logos"}.
                    </GlassNotification>
                  )}
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      )}

      <GlassModal open={newOpen} onOpenChange={setNewOpen} title="New QR code" description="Name it after where it'll be printed." size="sm">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setCreating(true);
            try {
              const res = await createQrAction(restaurant.id, {
                name: String(fd.get("name") ?? ""),
                menuId: String(fd.get("menuId") ?? "") || null,
                style: DEFAULT_STYLE,
              });
              if (!res.ok) return toast.error(res.error);
              setCodes((cs) => [...cs, res.data]);
              setSelectedId(res.data.id);
              setNewOpen(false);
              toast.success("QR code created");
            } finally {
              setCreating(false);
            }
          }}
        >
          <Field label="Name" htmlFor="new-qr-name">
            <GlassInput id="new-qr-name" name="name" required maxLength={60} placeholder="e.g. Patio tables" autoFocus />
          </Field>
          <Field label="Opens" htmlFor="new-qr-menu">
            <GlassSelect id="new-qr-menu" name="menuId" defaultValue="">
              <option value="">Main menu (first published)</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </GlassSelect>
          </Field>
          <div className="flex justify-end gap-2">
            <GlassButton type="button" variant="ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" loading={creating}>
              Create
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}

function ReadabilityRow({ ok, label, detail, pending }: { ok: boolean; label: string; detail?: string; pending?: boolean }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]",
          pending ? "bg-espresso/[0.04] text-espresso-600" : ok ? "bg-mint-soft/70 text-mint-ink" : "bg-danger/[0.07] text-danger",
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : ok ? (label.startsWith("Scan") ? <ShieldCheck className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />) : <AlertTriangle className="size-4" aria-hidden />}
        <span className="flex-1 font-medium">{label}</span>
        {detail && <span className="text-[12px] opacity-80">{detail}</span>}
      </motion.div>
    </AnimatePresence>
  );
}
