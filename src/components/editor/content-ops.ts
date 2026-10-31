import type { Category, MenuContent, MenuItem } from "@/lib/domain";

const uuid = () => crypto.randomUUID();

function reindex<T extends { position: number }>(list: T[]): T[] {
  return list.map((x, i) => (x.position === i ? x : { ...x, position: i }));
}

function mapCategory(c: MenuContent, id: string, fn: (cat: Category) => Category): MenuContent {
  return { ...c, categories: c.categories.map((cat) => (cat.id === id ? fn(cat) : cat)) };
}

export function newItem(categoryId: string, position: number): MenuItem {
  return {
    id: uuid(),
    categoryId,
    name: "",
    description: "",
    price: 0,
    available: true,
    featured: false,
    archived: false,
    dietary: [],
    allergens: [],
    imageUrl: null,
    position,
  };
}

export const ops = {
  addCategory(c: MenuContent, name = "New category"): [MenuContent, string] {
    const id = uuid();
    return [{ ...c, categories: [...c.categories, { id, name, description: "", position: c.categories.length, items: [] }] }, id];
  },
  updateCategory(c: MenuContent, id: string, patch: Partial<Pick<Category, "name" | "description">>) {
    return mapCategory(c, id, (cat) => ({ ...cat, ...patch }));
  },
  deleteCategory(c: MenuContent, id: string) {
    return { ...c, categories: reindex(c.categories.filter((cat) => cat.id !== id)) };
  },
  duplicateCategory(c: MenuContent, id: string): [MenuContent, string] {
    const idx = c.categories.findIndex((cat) => cat.id === id);
    if (idx < 0) return [c, id];
    const src = c.categories[idx];
    const newId = uuid();
    const copy: Category = {
      ...src,
      id: newId,
      name: `${src.name} (copy)`.slice(0, 80),
      items: src.items.map((i) => ({ ...i, id: uuid(), categoryId: newId })),
    };
    const categories = [...c.categories];
    categories.splice(idx + 1, 0, copy);
    return [{ ...c, categories: reindex(categories) }, newId];
  },
  moveCategory(c: MenuContent, from: number, to: number) {
    if (to < 0 || to >= c.categories.length || from === to) return c;
    const categories = [...c.categories];
    const [moved] = categories.splice(from, 1);
    categories.splice(to, 0, moved);
    return { ...c, categories: reindex(categories) };
  },
  addItem(c: MenuContent, categoryId: string): [MenuContent, string] {
    let id = "";
    const next = mapCategory(c, categoryId, (cat) => {
      const item = newItem(categoryId, cat.items.length);
      id = item.id;
      return { ...cat, items: [...cat.items, item] };
    });
    return [next, id];
  },
  updateItem(c: MenuContent, itemId: string, patch: Partial<MenuItem>) {
    return {
      ...c,
      categories: c.categories.map((cat) =>
        cat.items.some((i) => i.id === itemId) ? { ...cat, items: cat.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : cat,
      ),
    };
  },
  duplicateItem(c: MenuContent, itemId: string): [MenuContent, string] {
    const newId = uuid();
    return [
      {
        ...c,
        categories: c.categories.map((cat) => {
          const idx = cat.items.findIndex((i) => i.id === itemId);
          if (idx < 0) return cat;
          const items = [...cat.items];
          items.splice(idx + 1, 0, { ...cat.items[idx], id: newId, name: `${cat.items[idx].name} (copy)`.slice(0, 100) });
          return { ...cat, items: reindex(items) };
        }),
      },
      newId,
    ];
  },
  deleteItem(c: MenuContent, itemId: string) {
    return { ...c, categories: c.categories.map((cat) => ({ ...cat, items: reindex(cat.items.filter((i) => i.id !== itemId)) })) };
  },
  moveItem(c: MenuContent, categoryId: string, from: number, to: number) {
    return mapCategory(c, categoryId, (cat) => {
      if (to < 0 || to >= cat.items.length || from === to) return cat;
      const items = [...cat.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...cat, items: reindex(items) };
    });
  },
  moveItemToCategory(c: MenuContent, itemId: string, toCategoryId: string) {
    let item: MenuItem | undefined;
    const removed = c.categories.map((cat) => {
      const found = cat.items.find((i) => i.id === itemId);
      if (!found) return cat;
      item = found;
      return { ...cat, items: reindex(cat.items.filter((i) => i.id !== itemId)) };
    });
    if (!item) return c;
    const moved = item;
    return {
      ...c,
      categories: removed.map((cat) =>
        cat.id === toCategoryId ? { ...cat, items: [...cat.items, { ...moved, categoryId: toCategoryId, position: cat.items.length }] } : cat,
      ),
    };
  },
};

/** First human-readable validation problem, if any (mirrors server rules). */
export function findContentProblem(c: MenuContent): { message: string; categoryId?: string; itemId?: string } | null {
  if (!c.name.trim()) return { message: "Give this menu a name." };
  for (const cat of c.categories) {
    if (!cat.name.trim()) return { message: "A category needs a name.", categoryId: cat.id };
    for (const i of cat.items) {
      if (!i.name.trim()) return { message: `An item in “${cat.name}” needs a name.`, categoryId: cat.id, itemId: i.id };
    }
  }
  return null;
}
