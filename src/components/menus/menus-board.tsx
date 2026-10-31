"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  PencilLine,
  Plus,
  Rocket,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { Currency, Menu } from "@/lib/domain";
import { CURRENCIES } from "@/lib/domain";
import { cn, relativeTime } from "@/lib/utils";
import {
  createMenuAction,
  duplicateMenuAction,
  publishMenuAction,
  renameMenuAction,
  setMenuArchivedAction,
  unpublishMenuAction,
} from "@/app/actions/menus";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassModal } from "@/components/glass/glass-modal";
import { Field, GlassInput, GlassSelect } from "@/components/glass/glass-input";
import { Badge } from "@/components/glass/primitives";
import { GlassNotification } from "@/components/glass/glass-notification";
import {
  GlassDropdown,
  GlassDropdownContent,
  GlassDropdownItem,
  GlassDropdownSeparator,
  GlassDropdownTrigger,
} from "@/components/glass/glass-dropdown";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; upgrade?: string };

export function MenusBoard({
  restaurantId,
  restaurantSlug,
  currency,
  menus,
  covers,
  menuLimit,
  planName,
  openNew,
}: {
  restaurantId: string;
  restaurantSlug: string;
  currency: Currency;
  menus: Menu[];
  covers: Record<string, string | null>;
  menuLimit: number;
  planName: string;
  openNew: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNew);
  const [rename, setRename] = React.useState<Menu | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [upgrade, setUpgrade] = React.useState<string | null>(null);
  const active = menus.filter((m) => !m.archived);
  const archived = menus.filter((m) => m.archived);
  const atLimit = active.length >= menuLimit;

  const run = async (key: string, fn: () => Promise<Result>, success: string) => {
    setBusy(key);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error);
        if (res.upgrade) setUpgrade(res.error);
        return null;
      }
      toast.success(success);
      router.refresh();
      return res;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Menus"
        title="Your menus"
        description="Create menus for every service — dinner, drinks, brunch — and publish each when it's ready."
        actions={
          <GlassButton onClick={() => setNewOpen(true)}>
            <Plus /> New menu
          </GlassButton>
        }
      />
      {upgrade && (
        <GlassNotification
          tone="info"
          title={upgrade}
          className="mb-5"
          action={
            <GlassButton asChild size="xs" variant="lavender">
              <Link href="/dashboard/billing">See plans</Link>
            </GlassButton>
          }
        />
      )}
      <p className="mb-4 px-1 text-sm text-espresso-500">
        {active.length} of {menuLimit >= 50 ? "unlimited" : menuLimit} menu{menuLimit === 1 ? "" : "s"} used on {planName}
      </p>

      {active.length === 0 ? (
        <div className="glass rounded-[28px]">
          <EmptyState
            icon={<BookOpen />}
            title="No menus yet"
            description="Create your first menu to start adding dishes."
            action={
              <GlassButton onClick={() => setNewOpen(true)}>
                <Plus /> Create menu
              </GlassButton>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.04 }}
              className="glass glass-rim group relative flex flex-col overflow-hidden rounded-[26px] transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <Link href={`/dashboard/menus/${m.id}`} className="relative block h-40 overflow-hidden rounded-t-[26px]" aria-label={`Edit ${m.name}`}>
                {covers[m.id] ? (
                  <Image src={covers[m.id]!} alt="" fill sizes="(max-width: 640px) 100vw, 400px" unoptimized={covers[m.id]!.startsWith("/api/uploads/")} className="object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(140deg,#FFE3D2,#F6E2C2_55%,#E6DEFE)]">
                    <UtensilsCrossed className="size-8 text-terracotta/60" aria-hidden />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {m.status === "published" ? (
                    <Badge tone="mint" dot className="bg-white/90">
                      Live
                    </Badge>
                  ) : (
                    <Badge className="bg-white/90">Draft</Badge>
                  )}
                  {m.hasUnpublishedChanges && <Badge tone="champagne" className="bg-champagne-soft/95">Unpublished changes</Badge>}
                </div>
              </Link>
              <div className="flex flex-1 items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-[21px] font-medium tracking-[-0.02em] text-espresso">{m.name}</h2>
                  <p className="mt-0.5 text-[13px] text-espresso-500">
                    {m.itemCount} item{m.itemCount === 1 ? "" : "s"} · {m.currency} · edited {relativeTime(m.updatedAt)}
                  </p>
                </div>
                <GlassDropdown>
                  <GlassDropdownTrigger asChild>
                    <GlassButton variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`} loading={busy?.endsWith(m.id)}>
                      {busy?.endsWith(m.id) ? null : <MoreHorizontal />}
                    </GlassButton>
                  </GlassDropdownTrigger>
                  <GlassDropdownContent>
                    <GlassDropdownItem asChild>
                      <Link href={`/dashboard/menus/${m.id}`}>
                        <PencilLine /> Edit menu
                      </Link>
                    </GlassDropdownItem>
                    <GlassDropdownItem asChild>
                      <a href={`/dashboard/menus/${m.id}/preview`} target="_blank" rel="noreferrer">
                        <Eye /> Preview draft
                      </a>
                    </GlassDropdownItem>
                    {m.status === "published" && (
                      <GlassDropdownItem asChild>
                        <a href={`/m/${restaurantSlug}/${m.slug}`} target="_blank" rel="noreferrer">
                          <Sparkles /> View live
                        </a>
                      </GlassDropdownItem>
                    )}
                    <GlassDropdownSeparator />
                    <GlassDropdownItem onSelect={() => setRename(m)}>
                      <PencilLine /> Rename
                    </GlassDropdownItem>
                    <GlassDropdownItem onSelect={() => void run(`dup-${m.id}`, () => duplicateMenuAction(m.id), `Duplicated “${m.name}”`)}>
                      <Copy /> Duplicate
                    </GlassDropdownItem>
                    {m.status === "published" ? (
                      <GlassDropdownItem onSelect={() => void run(`unpub-${m.id}`, () => unpublishMenuAction(m.id), "Menu unpublished")}>
                        <EyeOff /> Unpublish
                      </GlassDropdownItem>
                    ) : (
                      <GlassDropdownItem onSelect={() => void run(`pub-${m.id}`, () => publishMenuAction(m.id), "Menu published")}>
                        <Rocket /> Publish
                      </GlassDropdownItem>
                    )}
                    <GlassDropdownSeparator />
                    <GlassDropdownItem destructive onSelect={() => void run(`arch-${m.id}`, () => setMenuArchivedAction(m.id, true), "Menu archived")}>
                      <Archive /> Archive
                    </GlassDropdownItem>
                  </GlassDropdownContent>
                </GlassDropdown>
              </div>
            </motion.li>
          ))}
          {!atLimit && (
            <li>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="group grid h-full min-h-[240px] w-full place-items-center rounded-[26px] border-2 border-dashed border-espresso/12 bg-white/30 text-espresso-500 transition-all duration-500 hover:border-terracotta/40 hover:bg-white/60 hover:text-espresso"
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110">
                    <Plus className="size-5 text-terracotta" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold">New menu</span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="mt-10" aria-labelledby="archived-heading">
          <h2 id="archived-heading" className="mb-3 px-1 text-sm font-semibold uppercase tracking-[0.12em] text-espresso-500">
            Archived
          </h2>
          <ul className="glass divide-y divide-espresso/[0.06] rounded-[22px]">
            {archived.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Archive className="size-4 text-espresso-400" aria-hidden />
                <span className="flex-1 truncate text-sm text-espresso">{m.name}</span>
                <span className="hidden text-xs text-espresso-500 sm:inline">{m.itemCount} items</span>
                <GlassButton
                  variant="outline"
                  size="xs"
                  loading={busy === `restore-${m.id}`}
                  onClick={() => void run(`restore-${m.id}`, () => setMenuArchivedAction(m.id, false), "Menu restored")}
                >
                  <ArchiveRestore /> Restore
                </GlassButton>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewMenuModal
        open={newOpen}
        onOpenChange={setNewOpen}
        currency={currency}
        atLimit={atLimit}
        planName={planName}
        onCreate={async (values) => {
          const res = await run("create", () => createMenuAction(restaurantId, values), "Menu created");
          if (res?.ok && res.data && typeof res.data === "object" && "menuId" in res.data) {
            setNewOpen(false);
            router.push(`/dashboard/menus/${(res.data as { menuId: string }).menuId}`);
          }
        }}
        busy={busy === "create"}
      />
      <GlassModal
        open={Boolean(rename)}
        onOpenChange={(o) => !o && setRename(null)}
        title="Rename menu"
        size="sm"
      >
        {rename && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name") ?? "");
              const res = await run(`rename-${rename.id}`, () => renameMenuAction(rename.id, name), "Menu renamed");
              if (res) setRename(null);
            }}
            className="space-y-4"
          >
            <Field label="Menu name" htmlFor="rename-name">
              <GlassInput id="rename-name" name="name" defaultValue={rename.name} autoFocus maxLength={80} required />
            </Field>
            <div className="flex justify-end gap-2">
              <GlassButton type="button" variant="ghost" onClick={() => setRename(null)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" loading={busy === `rename-${rename.id}`}>
                Save
              </GlassButton>
            </div>
          </form>
        )}
      </GlassModal>
    </div>
  );
}

function NewMenuModal({
  open,
  onOpenChange,
  currency,
  atLimit,
  planName,
  onCreate,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currency: Currency;
  atLimit: boolean;
  planName: string;
  onCreate: (v: { name: string; description: string; currency: Currency }) => Promise<void>;
  busy: boolean;
}) {
  const presets = ["Dinner", "Lunch", "Drinks", "Brunch", "Desserts", "Happy hour"];
  const [name, setName] = React.useState("");
  return (
    <GlassModal open={open} onOpenChange={onOpenChange} title="New menu" description="You can add categories and dishes in the editor." size="md">
      {atLimit && (
        <GlassNotification
          tone="info"
          className="mb-4"
          title={`You've reached the menu limit on ${planName}.`}
          action={
            <GlassButton asChild size="xs" variant="lavender">
              <Link href="/dashboard/billing">Upgrade</Link>
            </GlassButton>
          }
        >
          Archive a menu or upgrade to create more.
        </GlassNotification>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await onCreate({
            name: String(fd.get("name") ?? ""),
            description: String(fd.get("description") ?? ""),
            currency: String(fd.get("currency") ?? currency) as Currency,
          });
        }}
        className="space-y-4"
      >
        <Field label="Menu name" htmlFor="menu-name">
          <GlassInput id="menu-name" name="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dinner" autoFocus />
        </Field>
        <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setName(p)}
              className={cn("rounded-full border px-3 py-1 text-[13px] transition", name === p ? "border-terracotta bg-terracotta/10 text-terracotta-ink" : "border-espresso/10 bg-white/60 text-espresso-600 hover:bg-white")}
            >
              {p}
            </button>
          ))}
        </div>
        <Field label="Description" htmlFor="menu-desc" hint="Optional — e.g. “Served nightly from 5pm”.">
          <GlassInput id="menu-desc" name="description" maxLength={300} />
        </Field>
        <Field label="Currency" htmlFor="menu-currency" className="max-w-[180px]">
          <GlassSelect id="menu-currency" name="currency" defaultValue={currency}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </GlassSelect>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <GlassButton type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" loading={busy} disabled={atLimit || !name.trim()}>
            Create menu
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
