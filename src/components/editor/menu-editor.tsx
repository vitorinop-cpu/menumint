"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Check, CloudOff, Eye, Loader2, Redo2, Rocket, Save, Smartphone, Undo2, X } from "lucide-react";
import type { BrandingInput, Currency, Menu, MenuContent } from "@/lib/domain";
import { CURRENCIES } from "@/lib/domain";
import { cn, relativeTime } from "@/lib/utils";
import { publishMenuAction, saveMenuContentAction } from "@/app/actions/menus";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassFloatingToolbar, ToolbarButton, ToolbarDivider } from "@/components/glass/glass-floating-toolbar";
import { Badge } from "@/components/glass/primitives";
import { Segmented } from "@/components/glass/glass-tabs";
import { GlassModal } from "@/components/glass/glass-modal";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { MenuView, type MenuViewRestaurant } from "@/components/public-menu/menu-view";
import { useMenuHistory } from "./use-menu-history";
import { findContentProblem, ops } from "./content-ops";
import { CategoryPanel } from "./category-panel";
import { ItemPanel, type ItemHandlers } from "./item-panel";

type SaveState = "saved" | "dirty" | "saving" | "error" | "invalid";

export function MenuEditor({
  menu,
  initialContent,
  restaurant,
  branding,
  showBadge,
  focusItemId,
}: {
  menu: Menu;
  initialContent: MenuContent;
  restaurant: MenuViewRestaurant;
  branding: BrandingInput;
  showBadge: boolean;
  focusItemId: string | null;
}) {
  const router = useRouter();
  const history = useMenuHistory(initialContent);
  const { content, revision, apply } = history;
  const focusCategory = focusItemId ? initialContent.categories.find((c) => c.items.some((i) => i.id === focusItemId))?.id : undefined;
  const [selectedId, setSelectedId] = React.useState<string | null>(focusCategory ?? initialContent.categories[0]?.id ?? null);
  const [expandedId, setExpandedId] = React.useState<string | null>(focusItemId);
  const [status, setStatus] = React.useState(menu.status);
  const [hasUnpublished, setHasUnpublished] = React.useState(menu.hasUnpublishedChanges);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");
  const [problem, setProblem] = React.useState<ReturnType<typeof findContentProblem>>(null);
  const [savedAt, setSavedAt] = React.useState<string>(menu.updatedAt);
  const [publishing, setPublishing] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"categories" | "items" | "preview">("items");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  // ≥1280px: preview is a grid column (on by default). 1024–1279px: floating panel on demand.
  const [previewOpen, setPreviewOpen] = React.useState(true);
  const [floatOpen, setFloatOpen] = React.useState(false);
  const [, forceTick] = React.useState(0);

  const savedRevision = React.useRef(0);
  const contentRef = React.useRef(content);
  const revisionRef = React.useRef(revision);
  const savingRef = React.useRef<Promise<boolean> | null>(null);
  React.useEffect(() => {
    contentRef.current = content;
    revisionRef.current = revision;
  }, [content, revision]);

  const selected = content.categories.find((c) => c.id === selectedId) ?? content.categories[0] ?? null;

  const save = React.useCallback(async (): Promise<boolean> => {
    if (savingRef.current) await savingRef.current;
    const rev = revisionRef.current;
    if (rev === savedRevision.current) return true;
    const snapshot = contentRef.current;
    const issue = findContentProblem(snapshot);
    if (issue) {
      setProblem(issue);
      setSaveState("invalid");
      return false;
    }
    setProblem(null);
    setSaveState("saving");
    const p = (async () => {
      try {
        const res = await saveMenuContentAction(menu.id, snapshot);
        if (!res.ok) {
          setSaveState("error");
          toast.error(res.error);
          return false;
        }
        savedRevision.current = rev;
        setSavedAt(res.data.savedAt);
        setHasUnpublished(res.data.hasUnpublishedChanges);
        setStatus(res.data.status);
        setSaveState(revisionRef.current === rev ? "saved" : "dirty");
        return true;
      } catch {
        setSaveState("error");
        return false;
      } finally {
        savingRef.current = null;
      }
    })();
    savingRef.current = p;
    return p;
  }, [menu.id]);

  // Debounced autosave.
  React.useEffect(() => {
    if (revision === savedRevision.current) return;
    setSaveState((s) => (s === "saving" ? s : "dirty"));
    const t = setTimeout(() => void save(), 1200);
    return () => clearTimeout(t);
  }, [revision, save]);

  // Protect against losing unsaved edits.
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (revisionRef.current !== savedRevision.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Flush pending edits when navigating within the app.
      if (revisionRef.current !== savedRevision.current && !findContentProblem(contentRef.current)) {
        void saveMenuContentAction(menu.id, contentRef.current);
      }
    };
  }, [menu.id]);

  // Keyboard shortcuts.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement;
      const editing = target.closest("input, textarea, [contenteditable=true]");
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save().then((ok) => ok && toast.success("Draft saved"));
      } else if (e.key.toLowerCase() === "z" && !editing) {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (e.key.toLowerCase() === "y" && !editing) {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, save]);

  // Refresh the "saved x ago" label.
  React.useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const publish = async () => {
    setPublishing(true);
    try {
      const ok = await save();
      if (!ok) {
        toast.error("Fix the highlighted issue before publishing.");
        return;
      }
      const res = await publishMenuAction(menu.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setStatus("published");
      setHasUnpublished(false);
      toast.success("Menu published", {
        description: "Guests now see the latest version.",
        action: { label: "View live", onClick: () => window.open(`/m/${restaurant.slug}/${menu.slug}`, "_blank") },
      });
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  const openPreview = async () => {
    const win = window.open("about:blank", "_blank");
    const ok = await save();
    if (win) {
      if (ok) win.location.href = `/dashboard/menus/${menu.id}/preview`;
      else win.close();
    }
    if (!ok) toast.error("Fix the highlighted issue to preview.");
  };

  const handlers: ItemHandlers = {
    update: (itemId, patch, key) => apply((c) => ops.updateItem(c, itemId, patch), key),
    duplicate: (itemId) => {
      let newId = "";
      apply((c) => {
        const [next, id] = ops.duplicateItem(c, itemId);
        newId = id;
        return next;
      });
      setTimeout(() => setExpandedId(newId));
      toast.success("Item duplicated");
    },
    remove: (itemId) => apply((c) => ops.deleteItem(c, itemId)),
    move: (from, to) => selected && apply((c) => ops.moveItem(c, selected.id, from, to)),
    moveTo: (itemId, categoryId) => {
      apply((c) => ops.moveItemToCategory(c, itemId, categoryId));
      toast.success("Item moved");
    },
    add: () => {
      if (!selected) return;
      let newId = "";
      apply((c) => {
        const [next, id] = ops.addItem(c, selected.id);
        newId = id;
        return next;
      });
      setTimeout(() => setExpandedId(newId));
    },
  };

  const addCategory = () => {
    let newId = "";
    apply((c) => {
      const [next, id] = ops.addCategory(c);
      newId = id;
      return next;
    });
    setTimeout(() => {
      setSelectedId(newId);
      setMobileTab("items");
      document.getElementById("category-name")?.focus();
    });
  };

  const deleteCategory = (id: string) => {
    const cat = content.categories.find((c) => c.id === id);
    if (cat && cat.items.length > 0 && confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    apply((c) => ops.deleteCategory(c, id));
    setConfirmDelete(null);
    if (selectedId === id) setSelectedId(content.categories.find((c) => c.id !== id)?.id ?? null);
  };

  const statusBadge =
    status === "published" ? (
      hasUnpublished || saveState !== "saved" ? (
        <Badge tone="champagne">Unpublished changes</Badge>
      ) : (
        <Badge tone="mint" dot>
          Live
        </Badge>
      )
    ) : (
      <Badge>Draft</Badge>
    );

  const saveLabel = {
    saved: (
      <span className="flex items-center gap-1.5 text-espresso-500">
        <Check className="size-3.5 text-mint-ink" aria-hidden /> Saved {relativeTime(savedAt)}
      </span>
    ),
    dirty: <span className="text-espresso-500">Unsaved changes</span>,
    saving: (
      <span className="flex items-center gap-1.5 text-espresso-500">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
      </span>
    ),
    error: (
      <span className="flex items-center gap-1.5 text-danger">
        <CloudOff className="size-3.5" aria-hidden /> Couldn&apos;t save
      </span>
    ),
    invalid: (
      <span className="flex items-center gap-1.5 text-danger">
        <AlertCircle className="size-3.5" aria-hidden /> Needs attention
      </span>
    ),
  }[saveState];

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 px-1 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GlassButton asChild variant="ghost" size="icon" aria-label="Back to menus">
            <Link href="/dashboard/menus">
              <ArrowLeft />
            </Link>
          </GlassButton>
          <label htmlFor="menu-title" className="sr-only">
            Menu name
          </label>
          <input
            id="menu-title"
            value={content.name}
            maxLength={80}
            onChange={(e) => apply((c) => ({ ...c, name: e.target.value }), "menu-name")}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-medium tracking-[-0.03em] text-espresso outline-none transition hover:bg-white/50 focus:bg-white focus:shadow-[0_0_0_3px_rgb(233_117_66/0.15)]"
          />
          {statusBadge}
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-12 lg:pl-0">
          <label htmlFor="menu-currency" className="sr-only">
            Currency
          </label>
          <select
            id="menu-currency"
            value={content.currency}
            onChange={(e) => apply((c) => ({ ...c, currency: e.target.value as Currency }))}
            className="h-9 rounded-xl border border-espresso/10 bg-white/70 px-2.5 text-sm text-espresso outline-none focus:border-terracotta/60"
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label htmlFor="menu-description" className="sr-only">
            Menu description
          </label>
          <input
            id="menu-description"
            value={content.description}
            maxLength={300}
            placeholder="Menu note, e.g. Served nightly from 5pm"
            onChange={(e) => apply((c) => ({ ...c, description: e.target.value }), "menu-desc")}
            className="h-9 w-full min-w-0 rounded-xl border border-espresso/10 bg-white/70 px-3 text-sm text-espresso outline-none placeholder:text-espresso-400 focus:border-terracotta/60 sm:w-72"
          />
        </div>
      </div>

      {problem && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/[0.06] px-4 py-2.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{problem.message} Changes will save once it&apos;s fixed.</span>
          {problem.categoryId && (
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setSelectedId(problem.categoryId!);
                if (problem.itemId) setExpandedId(problem.itemId);
                setMobileTab("items");
              }}
            >
              Show me
            </button>
          )}
        </div>
      )}

      <div className="mb-4 lg:hidden">
        <Segmented
          id="editor-tabs"
          label="Editor section"
          value={mobileTab}
          onChange={setMobileTab}
          options={[
            { value: "categories", label: "Categories" },
            { value: "items", label: "Items" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div
        className={cn(
          "grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]",
          previewOpen && "xl:grid-cols-[220px_minmax(0,1fr)_300px] 2xl:grid-cols-[250px_minmax(0,1fr)_350px]",
        )}
      >
        <div className={cn("lg:block", mobileTab === "categories" ? "block" : "hidden")}>
          <div className="lg:sticky lg:top-24">
            <CategoryPanel
              categories={content.categories}
              selectedId={selected?.id ?? null}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileTab("items");
              }}
              onAdd={addCategory}
              onMove={(from, to) => apply((c) => ops.moveCategory(c, from, to))}
              onDuplicate={(id) => {
                let newId = "";
                apply((c) => {
                  const [next, nid] = ops.duplicateCategory(c, id);
                  newId = nid;
                  return next;
                });
                setTimeout(() => setSelectedId(newId));
              }}
              onDelete={deleteCategory}
            />
          </div>
        </div>

        <div className={cn("min-w-0 lg:block", mobileTab === "items" ? "block" : "hidden")}>
          {selected ? (
            <ItemPanel
              key={selected.id}
              category={selected}
              categories={content.categories}
              currency={content.currency}
              restaurantId={restaurant.id}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onCategoryChange={(patch) => apply((c) => ops.updateCategory(c, selected.id, patch), `cat-${selected.id}-${Object.keys(patch)[0]}`)}
              handlers={handlers}
              invalidItemId={problem?.itemId}
            />
          ) : (
            <div className="glass-strong grid place-items-center rounded-[26px] p-12 text-center">
              <p className="font-semibold text-espresso">Start with a category</p>
              <p className="mt-1 text-sm text-espresso-500">Group dishes into sections like Starters, Mains and Desserts.</p>
              <GlassButton className="mt-4" onClick={addCategory}>
                Add category
              </GlassButton>
            </div>
          )}
        </div>

        <div className={cn(mobileTab === "preview" ? "block lg:hidden" : "hidden", previewOpen && "xl:block")}>
          <div className="xl:sticky xl:top-24">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-espresso-500">Live preview · unpublished</p>
            <PhoneFrame fitHeight className="max-w-[330px]">
              <MenuView mode="preview" restaurant={restaurant} branding={branding} content={content} showBadge={showBadge} />
            </PhoneFrame>
          </div>
        </div>
      </div>

      {floatOpen && (
        <div className="glass-strong fixed right-5 top-24 z-30 hidden w-[320px] rounded-[32px] p-4 lg:block xl:hidden">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-espresso-500">Live preview</p>
            <button type="button" aria-label="Close preview" onClick={() => setFloatOpen(false)} className="grid size-7 place-items-center rounded-lg hover:bg-espresso/5">
              <X className="size-4" />
            </button>
          </div>
          <PhoneFrame className="max-h-[calc(100dvh-14rem)] w-auto max-w-[280px]" label="Floating live preview">
            <MenuView mode="preview" restaurant={restaurant} branding={branding} content={content} showBadge={showBadge} />
          </PhoneFrame>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 lg:pl-[284px]">
        <GlassFloatingToolbar label="Menu editor" className="pointer-events-auto">
          <ToolbarButton tooltip="Undo" shortcut="⌘Z" onClick={history.undo} disabled={!history.canUndo}>
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton tooltip="Redo" shortcut="⇧⌘Z" onClick={history.redo} disabled={!history.canRedo}>
            <Redo2 />
          </ToolbarButton>
          <ToolbarDivider />
          <span className="hidden min-w-[150px] px-2 text-[12.5px] sm:block" aria-live="polite">
            {saveLabel}
          </span>
          <ToolbarButton
            tooltip={previewOpen || floatOpen ? "Hide live preview" : "Show live preview"}
            aria-pressed={previewOpen || floatOpen}
            className="hidden lg:grid"
            onClick={() => {
              if (window.matchMedia("(min-width: 1280px)").matches) setPreviewOpen((o) => !o);
              else setFloatOpen((o) => !o);
            }}
          >
            <Smartphone />
          </ToolbarButton>
          <ToolbarButton tooltip="Preview draft" onClick={() => void openPreview()}>
            <Eye />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Save draft"
            shortcut="⌘S"
            onClick={() => void save().then((ok) => ok && toast.success("Draft saved"))}
            disabled={saveState === "saving"}
          >
            <Save />
          </ToolbarButton>
          <GlassButton size="sm" className="ml-1" onClick={() => void publish()} loading={publishing}>
            {!publishing && <Rocket />} {status === "published" ? "Publish changes" : "Publish"}
          </GlassButton>
        </GlassFloatingToolbar>
      </div>

      <GlassModal
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this category?"
        description="Its items will be removed from the draft. You can undo this until you leave the editor."
        size="sm"
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </GlassButton>
            <GlassButton variant="danger" onClick={() => confirmDelete && deleteCategory(confirmDelete)}>
              Delete category
            </GlassButton>
          </>
        }
      >
        <p className="text-sm text-espresso-600">
          “{content.categories.find((c) => c.id === confirmDelete)?.name}” contains {content.categories.find((c) => c.id === confirmDelete)?.items.length} items.
        </p>
      </GlassModal>
    </div>
  );
}
