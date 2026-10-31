"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassDropdown, GlassDropdownContent, GlassDropdownItem, GlassDropdownSeparator, GlassDropdownTrigger } from "@/components/glass/glass-dropdown";

export function CategoryPanel({
  categories,
  selectedId,
  onSelect,
  onAdd,
  onMove,
  onDuplicate,
  onDelete,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = categories.findIndex((c) => c.id === e.active.id);
    const to = categories.findIndex((c) => c.id === e.over!.id);
    onMove(from, to);
  };
  return (
    <div className="glass rounded-[24px] p-3">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-espresso-500">Categories</h2>
        <GlassButton variant="ghost" size="icon-sm" aria-label="Add category" onClick={onAdd}>
          <Plus />
        </GlassButton>
      </div>
      {categories.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-espresso-500">No categories yet.</p>
      ) : (
        <DndContext id="categories-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1" aria-label="Categories (drag to reorder)">
              {categories.map((c, i) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  index={i}
                  count={categories.length}
                  selected={c.id === selectedId}
                  onSelect={() => onSelect(c.id)}
                  onMove={onMove}
                  onDuplicate={() => onDuplicate(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <GlassButton variant="outline" size="sm" className="mt-3 w-full" onClick={onAdd}>
        <Plus /> Add category
      </GlassButton>
    </div>
  );
}

function CategoryRow({
  category,
  index,
  count,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
}: {
  category: Category;
  index: number;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const live = category.items.filter((i) => !i.archived).length;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1 rounded-[14px] pr-1 transition-[background,box-shadow]",
        selected ? "bg-white shadow-[0_1px_2px_rgb(36_27_24/0.06),0_6px_16px_-8px_rgb(36_27_24/0.18)]" : "hover:bg-white/60",
        isDragging && "relative z-10 scale-[1.02] bg-white shadow-[var(--shadow-lift)] ring-2 ring-terracotta/30",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="grid h-10 w-6 shrink-0 cursor-grab place-items-center rounded-lg text-espresso-400 opacity-60 hover:opacity-100 active:cursor-grabbing"
        aria-label={`Reorder ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" onClick={onSelect} aria-current={selected ? "true" : undefined} className="flex h-10 min-w-0 flex-1 items-center gap-2 text-left">
        <span className={cn("truncate text-sm", selected ? "font-semibold text-espresso" : "font-medium text-espresso-600")}>{category.name || "Untitled"}</span>
        <span className="ml-auto rounded-full bg-espresso/[0.06] px-1.5 text-[11px] font-semibold tabular-nums text-espresso-500">{live}</span>
      </button>
      <GlassDropdown>
        <GlassDropdownTrigger asChild>
          <button type="button" aria-label={`More actions for ${category.name}`} className="grid size-7 place-items-center rounded-lg text-espresso-400 opacity-0 transition hover:bg-espresso/5 hover:text-espresso focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="size-4" />
          </button>
        </GlassDropdownTrigger>
        <GlassDropdownContent align="start">
          <GlassDropdownItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
            <ArrowUp /> Move up
          </GlassDropdownItem>
          <GlassDropdownItem disabled={index === count - 1} onSelect={() => onMove(index, index + 1)}>
            <ArrowDown /> Move down
          </GlassDropdownItem>
          <GlassDropdownItem onSelect={onDuplicate}>
            <Copy /> Duplicate
          </GlassDropdownItem>
          <GlassDropdownSeparator />
          <GlassDropdownItem destructive onSelect={onDelete}>
            <Trash2 /> Delete category
          </GlassDropdownItem>
        </GlassDropdownContent>
      </GlassDropdown>
    </li>
  );
}
