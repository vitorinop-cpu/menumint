"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  FolderInput,
  GripVertical,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Allergen, Category, Currency, DietaryTag, MenuItem } from "@/lib/domain";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/domain";
import { cn, formatPrice, parsePrice, priceToInput } from "@/lib/utils";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassInput, GlassTextarea } from "@/components/glass/glass-input";
import { GlassSwitch, ToggleChip, Badge } from "@/components/glass/primitives";
import { GlassDropdown, GlassDropdownContent, GlassDropdownItem, GlassDropdownLabel, GlassDropdownSeparator, GlassDropdownTrigger } from "@/components/glass/glass-dropdown";
import { ImageUpload } from "@/components/shared/image-upload";
import { EmptyState } from "@/components/dashboard/page-header";

export interface ItemHandlers {
  update: (itemId: string, patch: Partial<MenuItem>, key?: string) => void;
  duplicate: (itemId: string) => void;
  remove: (itemId: string) => void;
  move: (from: number, to: number) => void;
  moveTo: (itemId: string, categoryId: string) => void;
  add: () => void;
}

export function ItemPanel({
  category,
  categories,
  currency,
  restaurantId,
  expandedId,
  setExpandedId,
  onCategoryChange,
  handlers,
  invalidItemId,
}: {
  category: Category;
  categories: Category[];
  currency: Currency;
  restaurantId: string;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onCategoryChange: (patch: { name?: string; description?: string }) => void;
  handlers: ItemHandlers;
  invalidItemId?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const live = category.items.filter((i) => !i.archived);
  const archived = category.items.filter((i) => i.archived);
  const [showArchived, setShowArchived] = React.useState(false);

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = category.items.findIndex((i) => i.id === e.active.id);
    const to = category.items.findIndex((i) => i.id === e.over!.id);
    handlers.move(from, to);
  };

  return (
    <div className="glass-strong @container rounded-[26px] p-4 sm:p-5">
      <div className="mb-4 space-y-1">
        <label htmlFor="category-name" className="sr-only">
          Category name
        </label>
        <input
          id="category-name"
          value={category.name}
          onChange={(e) => onCategoryChange({ name: e.target.value })}
          placeholder="Category name"
          maxLength={80}
          className="w-full rounded-xl bg-transparent px-2 py-1 font-display text-[26px] font-medium tracking-[-0.02em] text-espresso outline-none transition hover:bg-espresso/[0.03] focus:bg-white focus:shadow-[0_0_0_3px_rgb(233_117_66/0.15)]"
        />
        <label htmlFor="category-desc" className="sr-only">
          Category description
        </label>
        <input
          id="category-desc"
          value={category.description}
          onChange={(e) => onCategoryChange({ description: e.target.value })}
          placeholder="Add a short description (optional)"
          maxLength={300}
          className="w-full rounded-lg bg-transparent px-2 py-1 text-sm text-espresso-500 outline-none transition placeholder:text-espresso-400 hover:bg-espresso/[0.03] focus:bg-white focus:shadow-[0_0_0_3px_rgb(233_117_66/0.15)]"
        />
      </div>

      {live.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="No items in this category"
          description="Add your first dish — name, price, photo and allergens."
          action={
            <GlassButton onClick={handlers.add}>
              <Plus /> Add item
            </GlassButton>
          }
          className="rounded-2xl border border-dashed border-espresso/12 py-10"
        />
      ) : (
        <DndContext id={`items-dnd-${category.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={live.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2.5" aria-label={`Items in ${category.name} (drag to reorder)`}>
              {live.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={category.items.indexOf(item)}
                  liveIndex={live.indexOf(item)}
                  liveCount={live.length}
                  currency={currency}
                  categories={categories}
                  currentCategoryId={category.id}
                  restaurantId={restaurantId}
                  expanded={expandedId === item.id}
                  invalid={invalidItemId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  handlers={handlers}
                  neighbourIndex={(dir) => category.items.indexOf(live[live.indexOf(item) + dir])}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {live.length > 0 && (
        <GlassButton variant="outline" className="mt-3 w-full border-dashed" onClick={handlers.add}>
          <Plus /> Add item
        </GlassButton>
      )}

      {archived.length > 0 && (
        <div className="mt-5 border-t border-espresso/[0.07] pt-4">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            aria-expanded={showArchived}
            className="flex w-full items-center gap-2 text-sm font-medium text-espresso-500 hover:text-espresso"
          >
            <Archive className="size-4" aria-hidden /> Archived ({archived.length})
            <ChevronDown className={cn("ml-auto size-4 transition-transform", showArchived && "rotate-180")} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {showArchived && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {archived.map((item) => (
                  <li key={item.id} className="mt-2 flex items-center gap-3 rounded-xl bg-espresso/[0.03] px-3 py-2">
                    <span className="flex-1 truncate text-sm text-espresso-500 line-through">{item.name || "Untitled item"}</span>
                    <GlassButton size="xs" variant="outline" onClick={() => handlers.update(item.id, { archived: false })}>
                      <ArchiveRestore /> Restore
                    </GlassButton>
                    <GlassButton size="xs" variant="ghost" aria-label={`Delete ${item.name} permanently`} onClick={() => handlers.remove(item.id)}>
                      <Trash2 />
                    </GlassButton>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  index,
  liveIndex,
  liveCount,
  currency,
  categories,
  currentCategoryId,
  restaurantId,
  expanded,
  invalid,
  onToggle,
  handlers,
  neighbourIndex,
}: {
  item: MenuItem;
  index: number;
  liveIndex: number;
  liveCount: number;
  currency: Currency;
  categories: Category[];
  currentCategoryId: string;
  restaurantId: string;
  expanded: boolean;
  invalid: boolean;
  onToggle: () => void;
  handlers: ItemHandlers;
  neighbourIndex: (dir: -1 | 1) => number;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const ref = React.useRef<HTMLLIElement | null>(null);
  React.useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [expanded]);

  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        ref.current = el;
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "rounded-[18px] border bg-white/80 transition-[box-shadow,border-color,background]",
        expanded ? "border-terracotta/30 bg-white shadow-[var(--shadow-lift)]" : "border-espresso/[0.08] hover:border-espresso/15 hover:shadow-[var(--shadow-soft)]",
        isDragging && "relative z-20 rotate-[0.6deg] shadow-[0_20px_40px_-12px_rgb(36_27_24/0.35)] ring-2 ring-terracotta/40",
        invalid && "border-danger/50",
        !item.available && !expanded && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${item.name || "item"}`}
          className="grid h-10 w-6 shrink-0 cursor-grab place-items-center text-espresso-400 hover:text-espresso active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-peach-soft/60">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt="" fill sizes="48px" unoptimized={item.imageUrl.startsWith("/api/uploads/")} className="object-cover" />
            ) : (
              <ImageIcon className="size-4 text-terracotta/60" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className={cn("truncate text-[15px] font-semibold", item.name ? "text-espresso" : "italic text-espresso-400")}>{item.name || "Untitled item"}</span>
              {item.featured && <Sparkles className="size-3.5 shrink-0 text-champagne" aria-label="Featured" />}
              {!item.available && <Badge className="h-5 px-2 text-[10.5px]">Sold out</Badge>}
            </span>
            <span className="block truncate text-[13px] text-espresso-500">{item.description || "No description"}</span>
          </span>
          <span className="shrink-0 text-[15px] font-semibold tabular-nums text-espresso">{formatPrice(item.price, currency)}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-espresso-400 transition-transform duration-300", expanded && "rotate-180")} aria-hidden />
        </button>
        <span className="hidden sm:block">
          <GlassSwitch size="sm" checked={item.available} onCheckedChange={(v) => handlers.update(item.id, { available: v })} label={`${item.name || "Item"} available`} />
        </span>
        <GlassDropdown>
          <GlassDropdownTrigger asChild>
            <button type="button" aria-label={`More actions for ${item.name || "item"}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-espresso-400 hover:bg-espresso/5 hover:text-espresso">
              <MoreHorizontal className="size-4" />
            </button>
          </GlassDropdownTrigger>
          <GlassDropdownContent>
            <GlassDropdownItem disabled={liveIndex === 0} onSelect={() => handlers.move(index, neighbourIndex(-1))}>
              <ArrowUp /> Move up
            </GlassDropdownItem>
            <GlassDropdownItem disabled={liveIndex === liveCount - 1} onSelect={() => handlers.move(index, neighbourIndex(1))}>
              <ArrowDown /> Move down
            </GlassDropdownItem>
            <GlassDropdownItem onSelect={() => handlers.duplicate(item.id)}>
              <Copy /> Duplicate
            </GlassDropdownItem>
            {categories.length > 1 && (
              <>
                <GlassDropdownSeparator />
                <GlassDropdownLabel>Move to</GlassDropdownLabel>
                {categories
                  .filter((c) => c.id !== currentCategoryId)
                  .map((c) => (
                    <GlassDropdownItem key={c.id} onSelect={() => handlers.moveTo(item.id, c.id)}>
                      <FolderInput /> {c.name || "Untitled"}
                    </GlassDropdownItem>
                  ))}
              </>
            )}
            <GlassDropdownSeparator />
            <GlassDropdownItem destructive onSelect={() => handlers.update(item.id, { archived: true })}>
              <Archive /> Archive
            </GlassDropdownItem>
          </GlassDropdownContent>
        </GlassDropdown>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className="overflow-hidden"
          >
            <ItemEditor item={item} currency={currency} restaurantId={restaurantId} handlers={handlers} invalid={invalid} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ItemEditor({
  item,
  currency,
  restaurantId,
  handlers,
  invalid,
}: {
  item: MenuItem;
  currency: Currency;
  restaurantId: string;
  handlers: ItemHandlers;
  invalid: boolean;
}) {
  const id = item.id.slice(0, 8);
  const [price, setPrice] = React.useState(priceToInput(item.price, currency));
  const [priceError, setPriceError] = React.useState(false);
  const [lastPrice, setLastPrice] = React.useState(item.price);
  if (lastPrice !== item.price) {
    // Keep the field in sync with undo/redo.
    setLastPrice(item.price);
    if (parsePrice(price, currency) !== item.price) setPrice(priceToInput(item.price, currency));
  }
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="grid gap-4 border-t border-espresso/[0.07] p-4 @lg:grid-cols-[1fr_160px]">
      <div className="space-y-3.5">
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label htmlFor={`name-${id}`} className="mb-1.5 block text-[13px] font-medium text-espresso-600">
              Name
            </label>
            <GlassInput
              id={`name-${id}`}
              value={item.name}
              autoFocus={!item.name}
              maxLength={100}
              aria-invalid={invalid && !item.name.trim()}
              onChange={(e) => handlers.update(item.id, { name: e.target.value }, `name-${item.id}`)}
              placeholder="e.g. Burrata & tomatoes"
            />
          </div>
          <div>
            <label htmlFor={`price-${id}`} className="mb-1.5 block text-[13px] font-medium text-espresso-600">
              Price ({currency})
            </label>
            <GlassInput
              id={`price-${id}`}
              inputMode="decimal"
              value={price}
              aria-invalid={priceError}
              onChange={(e) => {
                setPrice(e.target.value);
                const parsed = parsePrice(e.target.value, currency);
                setPriceError(parsed === null && e.target.value.trim() !== "");
                if (parsed !== null) {
                  setLastPrice(parsed);
                  handlers.update(item.id, { price: parsed }, `price-${item.id}`);
                }
              }}
              onBlur={() => {
                setPrice(priceToInput(item.price, currency));
                setPriceError(false);
              }}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`desc-${id}`} className="mb-1.5 block text-[13px] font-medium text-espresso-600">
            Description
          </label>
          <GlassTextarea
            id={`desc-${id}`}
            value={item.description}
            maxLength={500}
            rows={2}
            onChange={(e) => handlers.update(item.id, { description: e.target.value }, `desc-${item.id}`)}
            placeholder="Ingredients, preparation, story…"
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2.5 text-sm text-espresso">
            <GlassSwitch checked={item.available} onCheckedChange={(v) => handlers.update(item.id, { available: v })} label="Available" />
            Available
          </label>
          <label className="flex items-center gap-2.5 text-sm text-espresso">
            <GlassSwitch checked={item.featured} onCheckedChange={(v) => handlers.update(item.id, { featured: v })} label="Chef's pick" />
            Chef&apos;s pick
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-espresso-600">Dietary labels</legend>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_TAGS.map((d) => (
              <ToggleChip key={d.id} pressed={item.dietary.includes(d.id)} onPressedChange={() => handlers.update(item.id, { dietary: toggle<DietaryTag>(item.dietary, d.id) })}>
                {d.label}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-espresso-600">Allergens</legend>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => (
              <ToggleChip
                key={a.id}
                tone="terracotta"
                pressed={item.allergens.includes(a.id)}
                onPressedChange={() => handlers.update(item.id, { allergens: toggle<Allergen>(item.allergens, a.id) })}
              >
                {a.label}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="max-w-[200px] @lg:max-w-none">
        <ImageUpload
          label="Photo"
          kind="item"
          restaurantId={restaurantId}
          value={item.imageUrl}
          onChange={(url) => handlers.update(item.id, { imageUrl: url })}
          aspect="aspect-square"
          rounded="rounded-[18px]"
        />
      </div>
    </div>
  );
}
