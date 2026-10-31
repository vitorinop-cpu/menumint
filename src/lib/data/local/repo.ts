import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import type { Repo, RestaurantInput } from "../repo";
import type { Category, Menu, MenuContent, MenuItem, Membership, QrCode } from "@/lib/domain";
import { mutate, readDb, type LocalDb, type MenuRow } from "./store";

const now = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);

function toMenu(db: LocalDb, row: MenuRow): Menu {
  const { publishedContent: _p, ...menu } = row;
  const itemCount = db.items.filter((i) => i.menuId === row.id && !i.archived).length;
  return { ...clone(menu), itemCount };
}

function buildContent(db: LocalDb, row: MenuRow): MenuContent {
  const categories: Category[] = db.categories
    .filter((c) => c.menuId === row.id)
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      position: c.position,
      items: db.items
        .filter((i) => i.categoryId === c.id)
        .sort((a, b) => a.position - b.position)
        .map(({ menuId: _m, ...i }) => clone(i) as MenuItem),
    }));
  return { name: row.name, description: row.description, currency: row.currency, categories };
}

function membershipView(db: LocalDb, m: LocalDb["memberships"][number]): Membership {
  const p = db.profiles.find((x) => x.id === m.userId);
  return { ...m, email: p?.email ?? "", fullName: p?.fullName ?? "" };
}

function mustFind<T>(v: T | undefined, what: string): T {
  if (!v) throw new Error(`${what} not found`);
  return v;
}

export const localRepo: Repo = {
  async getProfile(userId) {
    const db = await readDb();
    const p = db.profiles.find((x) => x.id === userId);
    return p ? clone(p) : null;
  },
  async updateProfile(userId, patch) {
    await mutate((db) => {
      const p = mustFind(db.profiles.find((x) => x.id === userId), "Profile");
      Object.assign(p, patch);
    });
  },

  async listRestaurantsForUser(userId) {
    const db = await readDb();
    return db.memberships
      .filter((m) => m.userId === userId)
      .map((m) => {
        const r = db.restaurants.find((x) => x.id === m.restaurantId);
        return r ? { ...clone(r), role: m.role } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async getRestaurant(id) {
    const db = await readDb();
    const r = db.restaurants.find((x) => x.id === id);
    return r ? clone(r) : null;
  },
  async getRestaurantBySlug(slug) {
    const db = await readDb();
    const r = db.restaurants.find((x) => x.slug === slug);
    return r ? clone(r) : null;
  },
  async isSlugTaken(slug, exceptRestaurantId) {
    const db = await readDb();
    return db.restaurants.some((r) => r.slug === slug && r.id !== exceptRestaurantId);
  },
  async countRestaurantsOwned(userId) {
    const db = await readDb();
    return db.restaurants.filter((r) => r.ownerId === userId).length;
  },
  async createRestaurant(ownerId, input, branding) {
    return mutate((db) => {
      if (db.restaurants.some((r) => r.slug === input.slug)) throw new Error("SLUG_TAKEN");
      const ts = now();
      const restaurant = { id: randomUUID(), ownerId, ...input, isDemo: false, createdAt: ts, updatedAt: ts };
      db.restaurants.push(restaurant);
      db.memberships.push({ restaurantId: restaurant.id, userId: ownerId, role: "owner", createdAt: ts });
      db.branding.push({ restaurantId: restaurant.id, ...branding, updatedAt: ts });
      return clone(restaurant);
    });
  },
  async updateRestaurant(id, patch: Partial<RestaurantInput>) {
    return mutate((db) => {
      const r = mustFind(db.restaurants.find((x) => x.id === id), "Restaurant");
      if (patch.slug && db.restaurants.some((x) => x.slug === patch.slug && x.id !== id)) throw new Error("SLUG_TAKEN");
      Object.assign(r, patch, { updatedAt: now() });
      return clone(r);
    });
  },

  async getMembership(userId, restaurantId) {
    const db = await readDb();
    const m = db.memberships.find((x) => x.userId === userId && x.restaurantId === restaurantId);
    return m ? membershipView(db, m) : null;
  },
  async listMembers(restaurantId) {
    const db = await readDb();
    return db.memberships.filter((m) => m.restaurantId === restaurantId).map((m) => membershipView(db, m));
  },
  async addMemberByEmail(restaurantId, email, role) {
    return mutate((db) => {
      const p = db.profiles.find((x) => x.email === email.toLowerCase());
      if (!p) return "not_found" as const;
      if (db.memberships.some((m) => m.restaurantId === restaurantId && m.userId === p.id)) return "exists" as const;
      const m = { restaurantId, userId: p.id, role, createdAt: now() };
      db.memberships.push(m);
      return membershipView(db, m);
    });
  },
  async removeMember(restaurantId, userId) {
    await mutate((db) => {
      db.memberships = db.memberships.filter((m) => !(m.restaurantId === restaurantId && m.userId === userId));
    });
  },

  async getBranding(restaurantId) {
    const db = await readDb();
    const b = db.branding.find((x) => x.restaurantId === restaurantId);
    return b ? clone(b) : null;
  },
  async saveBranding(restaurantId, input) {
    return mutate((db) => {
      const next = { restaurantId, ...input, updatedAt: now() };
      const idx = db.branding.findIndex((x) => x.restaurantId === restaurantId);
      if (idx >= 0) db.branding[idx] = next;
      else db.branding.push(next);
      return clone(next);
    });
  },

  async listMenus(restaurantId) {
    const db = await readDb();
    return db.menus
      .filter((m) => m.restaurantId === restaurantId)
      .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))
      .map((m) => toMenu(db, m));
  },
  async getMenu(menuId) {
    const db = await readDb();
    const m = db.menus.find((x) => x.id === menuId);
    return m ? toMenu(db, m) : null;
  },
  async getMenuTree(menuId) {
    const db = await readDb();
    const m = db.menus.find((x) => x.id === menuId);
    if (!m) return null;
    return { menu: toMenu(db, m), ...buildContent(db, m) };
  },
  async createMenu(restaurantId, input, content) {
    return mutate((db) => {
      const ts = now();
      const position = db.menus.filter((m) => m.restaurantId === restaurantId).length;
      const row: MenuRow = {
        id: randomUUID(),
        restaurantId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        currency: input.currency,
        status: "draft",
        hasUnpublishedChanges: false,
        publishedAt: null,
        archived: false,
        position,
        createdAt: ts,
        updatedAt: ts,
        publishedContent: null,
      };
      db.menus.push(row);
      if (content) writeContent(db, row, content);
      return toMenu(db, row);
    });
  },
  async updateMenuMeta(menuId, patch) {
    return mutate((db) => {
      const m = mustFind(db.menus.find((x) => x.id === menuId), "Menu");
      Object.assign(m, patch, { updatedAt: now() });
      return toMenu(db, m);
    });
  },
  async saveMenuContent(menuId, content) {
    return mutate((db) => {
      const m = mustFind(db.menus.find((x) => x.id === menuId), "Menu");
      writeContent(db, m, content);
      m.name = content.name;
      m.description = content.description;
      m.currency = content.currency;
      m.updatedAt = now();
      if (m.status === "published") m.hasUnpublishedChanges = true;
      return toMenu(db, m);
    });
  },
  async publishMenu(menuId) {
    return mutate((db) => {
      const m = mustFind(db.menus.find((x) => x.id === menuId), "Menu");
      const content = buildContent(db, m);
      content.categories = content.categories.map((c) => ({ ...c, items: c.items.filter((i) => !i.archived) }));
      m.publishedContent = content;
      m.status = "published";
      m.hasUnpublishedChanges = false;
      m.publishedAt = now();
      m.updatedAt = m.publishedAt;
      return toMenu(db, m);
    });
  },
  async unpublishMenu(menuId) {
    return mutate((db) => {
      const m = mustFind(db.menus.find((x) => x.id === menuId), "Menu");
      m.status = "draft";
      m.publishedContent = null;
      m.hasUnpublishedChanges = false;
      m.updatedAt = now();
      return toMenu(db, m);
    });
  },
  async getPublishedMenus(restaurantId) {
    const db = await readDb();
    return db.menus
      .filter((m) => m.restaurantId === restaurantId && m.status === "published" && !m.archived && m.publishedContent)
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ menu: toMenu(db, m), content: clone(m.publishedContent!) }));
  },

  async recordImage(restaurantId, storagePath, url, userId) {
    await mutate((db) => {
      db.images.push({ id: randomUUID(), restaurantId, storagePath, url, uploadedBy: userId, createdAt: now() });
    });
  },

  async listQrCodes(restaurantId) {
    const db = await readDb();
    return clone(db.qrCodes.filter((q) => q.restaurantId === restaurantId && !q.archived)).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  },
  async getQrCode(id) {
    const db = await readDb();
    const q = db.qrCodes.find((x) => x.id === id);
    return q ? clone(q) : null;
  },
  async getQrByCode(code) {
    const db = await readDb();
    const q = db.qrCodes.find((x) => x.code === code);
    return q ? clone(q) : null;
  },
  async createQrCode(restaurantId, input) {
    return mutate((db) => {
      let code = "";
      do code = randomBytes(6).toString("base64url").replace(/[-_]/g, "").slice(0, 8).toLowerCase();
      while (code.length < 8 || db.qrCodes.some((q) => q.code === code));
      const ts = now();
      const qr: QrCode = { id: randomUUID(), restaurantId, code, ...input, archived: false, createdAt: ts, updatedAt: ts };
      db.qrCodes.push(qr);
      return clone(qr);
    });
  },
  async updateQrCode(id, patch) {
    return mutate((db) => {
      const q = mustFind(db.qrCodes.find((x) => x.id === id), "QR code");
      Object.assign(q, patch, { updatedAt: now() });
      return clone(q);
    });
  },

  async recordEvent(event) {
    await mutate((db) => {
      db.events.push({ id: randomUUID(), ...event });
    });
  },
  async listEvents(restaurantId, fromIso, toIso) {
    const db = await readDb();
    return db.events.filter((e) => e.restaurantId === restaurantId && e.occurredAt >= fromIso && e.occurredAt <= toIso);
  },

  async getSubscription(userId) {
    const db = await readDb();
    const s = db.subscriptions.find((x) => x.userId === userId);
    return s ? clone(s) : null;
  },
  async upsertSubscription(sub) {
    await mutate((db) => {
      const next = { ...sub, updatedAt: now() };
      const idx = db.subscriptions.findIndex((x) => x.userId === sub.userId);
      if (idx >= 0) db.subscriptions[idx] = next;
      else db.subscriptions.push(next);
    });
  },
  async findUserIdByStripeCustomer(customerId) {
    const db = await readDb();
    return db.subscriptions.find((s) => s.stripeCustomerId === customerId)?.userId ?? null;
  },

  async logActivity(entry) {
    await mutate((db) => {
      db.activity.push({ id: randomUUID(), createdAt: now(), ...entry });
      if (db.activity.length > 2000) db.activity = db.activity.slice(-2000);
    });
  },
  async listActivity(restaurantId, limit) {
    const db = await readDb();
    return clone(
      db.activity
        .filter((a) => a.restaurantId === restaurantId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  },
};

function writeContent(db: LocalDb, row: MenuRow, content: MenuContent) {
  db.categories = db.categories.filter((c) => c.menuId !== row.id);
  db.items = db.items.filter((i) => i.menuId !== row.id);
  // IDs are client-generated; never let a payload claim rows owned by another menu.
  const foreignCategoryIds = new Set(db.categories.map((c) => c.id));
  const foreignItemIds = new Set(db.items.map((i) => i.id));
  const seen = new Set<string>();
  const safeId = (id: string, foreign: Set<string>) => {
    const next = foreign.has(id) || seen.has(id) ? randomUUID() : id;
    seen.add(next);
    return next;
  };
  content.categories.forEach((c, ci) => {
    const categoryId = safeId(c.id, foreignCategoryIds);
    db.categories.push({ id: categoryId, menuId: row.id, name: c.name, description: c.description, position: ci });
    c.items.forEach((i, ii) => {
      db.items.push({
        ...i,
        id: safeId(i.id, foreignItemIds),
        menuId: row.id,
        categoryId,
        position: ii,
        dietary: [...i.dietary],
        allergens: [...i.allergens],
      });
    });
  });
}
