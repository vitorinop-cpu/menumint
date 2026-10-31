import "server-only";
import { randomInt } from "node:crypto";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Repo, RestaurantInput } from "../repo";
import type {
  Activity,
  AnalyticsEvent,
  AnalyticsEventType,
  Allergen,
  Branding,
  BrandingInput,
  Category,
  Currency,
  DeviceClass,
  DietaryTag,
  FontId,
  Membership,
  Menu,
  MenuContent,
  MenuItem,
  OnboardingDraft,
  PlanId,
  Profile,
  QrCode,
  QrStyle,
  Restaurant,
  Role,
  Subscription,
  SubscriptionStatus,
  TemplateId,
} from "@/lib/domain";

// ---------------------------------------------------------------------------
// Row types (snake_case, as returned by PostgREST)
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  onboarding: OnboardingDraft | null;
  created_at: string;
}

interface RestaurantRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  website: string;
  currency: string;
  logo_url: string | null;
  cover_url: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

interface MemberRow {
  restaurant_id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface BrandingRow {
  restaurant_id: string;
  template: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
  button_style: Branding["buttonStyle"];
  card_style: Branding["cardStyle"];
  radius: number;
  background: Branding["background"];
  category_nav: Branding["categoryNav"];
  item_layout: Branding["itemLayout"];
  header_style: Branding["headerStyle"];
  theme: Branding["theme"];
  show_images: boolean;
  updated_at: string;
}

interface MenuRow {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string;
  currency: string;
  status: Menu["status"];
  has_unpublished_changes: boolean;
  published_at: string | null;
  archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  menu_items?: { count: number }[] | null;
  published_content?: MenuContent | null;
}

interface CategoryRow {
  id: string;
  menu_id: string;
  name: string;
  description: string;
  position: number;
}

interface ItemRow {
  id: string;
  menu_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  featured: boolean;
  archived: boolean;
  dietary: string[] | null;
  allergens: string[] | null;
  image_url: string | null;
  position: number;
}

interface QrRow {
  id: string;
  restaurant_id: string;
  code: string;
  name: string;
  menu_id: string | null;
  style: QrStyle;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: number | string;
  restaurant_id: string;
  type: AnalyticsEventType;
  menu_id: string | null;
  item_id: string | null;
  qr_code_id: string | null;
  device: DeviceClass;
  referrer_host: string | null;
  is_demo: boolean;
  occurred_at: string;
}

interface SubscriptionRow {
  user_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  source: Subscription["source"];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

interface ActivityRow {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  kind: Activity["kind"];
  message: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type DbResult = { data: unknown; error: PostgrestError | null };

const PAGE_SIZE = 1000; // PostgREST default max-rows
const MAX_EVENT_ROWS = 100_000;

const MENU_COLUMNS =
  "id, restaurant_id, name, slug, description, currency, status, has_unpublished_changes, published_at, archived, position, created_at, updated_at";
const MENU_WITH_COUNT = `${MENU_COLUMNS}, menu_items(count)`;

function dbError(op: string, error: PostgrestError): Error {
  return new Error(`${op} failed: ${error.message}${error.code ? ` [${error.code}]` : ""}`);
}

function must<T>(op: string, res: DbResult): T {
  if (res.error) throw dbError(op, res.error);
  return res.data as T;
}

function isUniqueViolation(error: PostgrestError | null, constraint?: string): boolean {
  if (!error || error.code !== "23505") return false;
  if (!constraint) return true;
  return `${error.message} ${error.details ?? ""}`.includes(constraint);
}

/** Normalises Postgres timestamps ("…+00:00", microseconds) to JS ISO strings. */
function iso(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}
function isoOrNull(value: string | null): string | null {
  return value === null ? null : iso(value);
}

/** Fetches every row of a query in PAGE_SIZE chunks (PostgREST caps each response). */
async function fetchAll<T>(
  op: string,
  page: (from: number, to: number) => PromiseLike<DbResult>,
  max = MAX_EVENT_ROWS,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE, max) - 1;
    const batch = must<T[] | null>(op, await page(from, to)) ?? [];
    out.push(...batch);
    if (batch.length < to - from + 1) break;
  }
  return out;
}

const QR_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
function generateQrCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += QR_ALPHABET[randomInt(QR_ALPHABET.length)];
  return code;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    onboarding: r.onboarding ?? null,
    createdAt: iso(r.created_at),
  };
}

function toRestaurant(r: RestaurantRow): Restaurant {
  return {
    id: r.id,
    ownerId: r.owner_id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    cuisine: r.cuisine,
    address: r.address,
    phone: r.phone,
    website: r.website,
    currency: r.currency as Currency,
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
    isDemo: r.is_demo,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function restaurantPatch(input: Partial<RestaurantInput>): Record<string, string | null> {
  const row: Record<string, string | null> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.name !== undefined) row.name = input.name;
  if (input.tagline !== undefined) row.tagline = input.tagline;
  if (input.description !== undefined) row.description = input.description;
  if (input.cuisine !== undefined) row.cuisine = input.cuisine;
  if (input.address !== undefined) row.address = input.address;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.website !== undefined) row.website = input.website;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.logoUrl !== undefined) row.logo_url = input.logoUrl;
  if (input.coverUrl !== undefined) row.cover_url = input.coverUrl;
  return row;
}

function toMembership(r: MemberRow): Membership {
  return {
    restaurantId: r.restaurant_id,
    userId: r.user_id,
    role: r.role as Role,
    email: r.email ?? "",
    fullName: r.full_name ?? "",
    createdAt: iso(r.created_at),
  };
}

function toBranding(r: BrandingRow): Branding {
  return {
    restaurantId: r.restaurant_id,
    template: r.template as TemplateId,
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    backgroundColor: r.background_color,
    headingFont: r.heading_font as FontId,
    bodyFont: r.body_font as FontId,
    buttonStyle: r.button_style,
    cardStyle: r.card_style,
    radius: r.radius,
    background: r.background,
    categoryNav: r.category_nav,
    itemLayout: r.item_layout,
    headerStyle: r.header_style,
    theme: r.theme,
    showImages: r.show_images,
    updatedAt: iso(r.updated_at),
  };
}

function brandingRow(restaurantId: string, b: BrandingInput) {
  return {
    restaurant_id: restaurantId,
    template: b.template,
    primary_color: b.primaryColor,
    secondary_color: b.secondaryColor,
    background_color: b.backgroundColor,
    heading_font: b.headingFont,
    body_font: b.bodyFont,
    button_style: b.buttonStyle,
    card_style: b.cardStyle,
    radius: b.radius,
    background: b.background,
    category_nav: b.categoryNav,
    item_layout: b.itemLayout,
    header_style: b.headerStyle,
    theme: b.theme,
    show_images: b.showImages,
  };
}

function toMenu(r: MenuRow): Menu {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    currency: r.currency as Currency,
    status: r.status,
    hasUnpublishedChanges: r.has_unpublished_changes,
    publishedAt: isoOrNull(r.published_at),
    archived: r.archived,
    position: r.position,
    itemCount: r.menu_items?.[0]?.count ?? 0,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toItem(r: ItemRow): MenuItem {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description,
    price: r.price,
    available: r.available,
    featured: r.featured,
    archived: r.archived,
    dietary: (r.dietary ?? []) as DietaryTag[],
    allergens: (r.allergens ?? []) as Allergen[],
    imageUrl: r.image_url,
    position: r.position,
  };
}

function toQr(r: QrRow): QrCode {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    code: r.code,
    name: r.name,
    menuId: r.menu_id,
    style: r.style,
    archived: r.archived,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toEvent(r: EventRow): AnalyticsEvent {
  return {
    id: String(r.id),
    restaurantId: r.restaurant_id,
    type: r.type,
    menuId: r.menu_id,
    itemId: r.item_id,
    qrCodeId: r.qr_code_id,
    device: r.device,
    referrerHost: r.referrer_host,
    isDemo: r.is_demo,
    occurredAt: iso(r.occurred_at),
  };
}

function toSubscription(r: SubscriptionRow): Subscription {
  return {
    userId: r.user_id,
    plan: r.plan,
    status: r.status,
    source: r.source,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    currentPeriodEnd: isoOrNull(r.current_period_end),
    cancelAtPeriodEnd: r.cancel_at_period_end,
    updatedAt: iso(r.updated_at),
  };
}

function toActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    userId: r.user_id,
    kind: r.kind,
    message: r.message,
    createdAt: iso(r.created_at),
  };
}

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------

/**
 * Supabase-backed Repo. Works with a user-scoped client (RLS applies) or the
 * service-role client. Schema: supabase/migrations/20261030000000_init.sql.
 */
export function createSupabaseRepo(client: SupabaseClient): Repo {
  async function fetchMenu(menuId: string): Promise<Menu | null> {
    const res = await client
      .from("menus")
      .select(MENU_WITH_COUNT)
      .eq("id", menuId)
      .eq("menu_items.archived", false)
      .maybeSingle();
    const row = must<MenuRow | null>("Load menu", res);
    return row ? toMenu(row) : null;
  }

  async function requireMenu(menuId: string): Promise<Menu> {
    const menu = await fetchMenu(menuId);
    if (!menu) throw new Error("Menu not found");
    return menu;
  }

  async function fetchMembers(restaurantId: string, userId?: string): Promise<Membership[]> {
    const args: { p_restaurant_id: string; p_user_id?: string } = { p_restaurant_id: restaurantId };
    if (userId) args.p_user_id = userId;
    const rows = must<MemberRow[] | null>("Load members", await client.rpc("restaurant_members", args));
    return (rows ?? []).map(toMembership);
  }

  function rpcError(op: string, error: PostgrestError): Error {
    if (error.code === "P0002") return new Error("Menu not found");
    return dbError(op, error);
  }

  const repo: Repo = {
    // -- profiles ------------------------------------------------------------
    async getProfile(userId) {
      const res = await client
        .from("profiles")
        .select("id, email, full_name, onboarding, created_at")
        .eq("id", userId)
        .maybeSingle();
      const row = must<ProfileRow | null>("Load profile", res);
      return row ? toProfile(row) : null;
    },

    async updateProfile(userId, patch) {
      const row: { full_name?: string; onboarding?: OnboardingDraft | null } = {};
      if (patch.fullName !== undefined) row.full_name = patch.fullName;
      if (patch.onboarding !== undefined) row.onboarding = patch.onboarding;
      if (Object.keys(row).length === 0) return;
      const res = await client.from("profiles").update(row).eq("id", userId).select("id");
      const rows = must<{ id: string }[] | null>("Update profile", res);
      if (!rows?.length) throw new Error("Profile not found");
    },

    // -- restaurants ---------------------------------------------------------
    async listRestaurantsForUser(userId) {
      const res = await client.from("restaurant_memberships").select("role, restaurants(*)").eq("user_id", userId);
      const rows = must<{ role: Role; restaurants: RestaurantRow | null }[] | null>("List restaurants", res) ?? [];
      return rows
        .filter((r): r is { role: Role; restaurants: RestaurantRow } => r.restaurants !== null)
        .map((r) => ({ ...toRestaurant(r.restaurants), role: r.role }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async getRestaurant(id) {
      const row = must<RestaurantRow | null>(
        "Load restaurant",
        await client.from("restaurants").select("*").eq("id", id).maybeSingle(),
      );
      return row ? toRestaurant(row) : null;
    },

    async getRestaurantBySlug(slug) {
      const row = must<RestaurantRow | null>(
        "Load restaurant",
        await client.from("restaurants").select("*").eq("slug", slug).maybeSingle(),
      );
      return row ? toRestaurant(row) : null;
    },

    async isSlugTaken(slug, exceptRestaurantId) {
      let query = client.from("restaurants").select("id").eq("slug", slug);
      if (exceptRestaurantId) query = query.neq("id", exceptRestaurantId);
      const rows = must<{ id: string }[] | null>("Check slug", await query.limit(1));
      return (rows?.length ?? 0) > 0;
    },

    async countRestaurantsOwned(userId) {
      const res = await client.from("restaurants").select("id", { count: "exact", head: true }).eq("owner_id", userId);
      if (res.error) throw dbError("Count restaurants", res.error);
      return res.count ?? 0;
    },

    async createRestaurant(ownerId, input, branding) {
      const res = await client
        .from("restaurants")
        .insert({ owner_id: ownerId, ...restaurantPatch(input) })
        .select("*")
        .single();
      if (isUniqueViolation(res.error, "restaurants_slug_key")) throw new Error("SLUG_TAKEN");
      const restaurant = toRestaurant(must<RestaurantRow>("Create restaurant", res));
      // The owner membership is inserted by the on_restaurant_created trigger.
      const brandingRes = await client
        .from("branding_configs")
        .upsert(brandingRow(restaurant.id, branding), { onConflict: "restaurant_id" });
      if (brandingRes.error) {
        await client.from("restaurants").delete().eq("id", restaurant.id);
        throw dbError("Create restaurant branding", brandingRes.error);
      }
      return restaurant;
    },

    async updateRestaurant(id, patch) {
      const row = restaurantPatch(patch);
      if (Object.keys(row).length === 0) {
        const current = await repo.getRestaurant(id);
        if (!current) throw new Error("Restaurant not found");
        return current;
      }
      const res = await client.from("restaurants").update(row).eq("id", id).select("*").maybeSingle();
      if (isUniqueViolation(res.error, "restaurants_slug_key")) throw new Error("SLUG_TAKEN");
      const updated = must<RestaurantRow | null>("Update restaurant", res);
      if (!updated) throw new Error("Restaurant not found");
      return toRestaurant(updated);
    },

    // -- memberships ---------------------------------------------------------
    async getMembership(userId, restaurantId) {
      const [m] = await fetchMembers(restaurantId, userId);
      return m ?? null;
    },

    async listMembers(restaurantId) {
      return fetchMembers(restaurantId);
    },

    async addMemberByEmail(restaurantId, email, role) {
      const profileId = must<string | null>(
        "Find user",
        await client.rpc("find_profile_id_by_email", { p_email: email.trim().toLowerCase() }),
      );
      if (!profileId) return "not_found";
      const existing = must<{ user_id: string } | null>(
        "Check membership",
        await client
          .from("restaurant_memberships")
          .select("user_id")
          .eq("restaurant_id", restaurantId)
          .eq("user_id", profileId)
          .maybeSingle(),
      );
      if (existing) return "exists";
      const res = await client.from("restaurant_memberships").insert({ restaurant_id: restaurantId, user_id: profileId, role });
      if (isUniqueViolation(res.error)) return "exists";
      if (res.error) throw dbError("Add member", res.error);
      const [m] = await fetchMembers(restaurantId, profileId);
      if (!m) throw new Error("Member was added but could not be loaded");
      return m;
    },

    async removeMember(restaurantId, userId) {
      const res = await client
        .from("restaurant_memberships")
        .delete()
        .eq("restaurant_id", restaurantId)
        .eq("user_id", userId);
      if (res.error) throw dbError("Remove member", res.error);
    },

    // -- branding ------------------------------------------------------------
    async getBranding(restaurantId) {
      const row = must<BrandingRow | null>(
        "Load branding",
        await client.from("branding_configs").select("*").eq("restaurant_id", restaurantId).maybeSingle(),
      );
      return row ? toBranding(row) : null;
    },

    async saveBranding(restaurantId, input) {
      const res = await client
        .from("branding_configs")
        .upsert(brandingRow(restaurantId, input), { onConflict: "restaurant_id" })
        .select("*")
        .single();
      return toBranding(must<BrandingRow>("Save branding", res));
    },

    // -- menus ---------------------------------------------------------------
    async listMenus(restaurantId) {
      const res = await client
        .from("menus")
        .select(MENU_WITH_COUNT)
        .eq("restaurant_id", restaurantId)
        .eq("menu_items.archived", false)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      return (must<MenuRow[] | null>("List menus", res) ?? []).map(toMenu);
    },

    async getMenu(menuId) {
      return fetchMenu(menuId);
    },

    async getMenuTree(menuId) {
      const menu = await fetchMenu(menuId);
      if (!menu) return null;
      const [categories, items] = await Promise.all([
        fetchAll<CategoryRow>("Load categories", (from, to) =>
          client
            .from("menu_categories")
            .select("id, menu_id, name, description, position")
            .eq("menu_id", menuId)
            .order("position", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        ),
        fetchAll<ItemRow>("Load items", (from, to) =>
          client
            .from("menu_items")
            .select(
              "id, menu_id, category_id, name, description, price, available, featured, archived, dietary, allergens, image_url, position",
            )
            .eq("menu_id", menuId)
            .order("position", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        ),
      ]);
      const byCategory = new Map<string, MenuItem[]>();
      for (const row of items) {
        const list = byCategory.get(row.category_id) ?? [];
        list.push(toItem(row));
        byCategory.set(row.category_id, list);
      }
      const tree: Category[] = categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        position: c.position,
        items: byCategory.get(c.id) ?? [],
      }));
      return { menu, name: menu.name, description: menu.description, currency: menu.currency, categories: tree };
    },

    async createMenu(restaurantId, input, content) {
      const countRes = await client
        .from("menus")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId);
      if (countRes.error) throw dbError("Count menus", countRes.error);
      const res = await client
        .from("menus")
        .insert({
          restaurant_id: restaurantId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          currency: input.currency,
          status: "draft",
          position: countRes.count ?? 0,
        })
        .select("id")
        .single();
      const { id } = must<{ id: string }>("Create menu", res);
      if (content) {
        const { error } = await client.rpc("save_menu_content", { p_menu_id: id, p_content: content });
        if (error) throw rpcError("Save menu content", error);
      }
      return requireMenu(id);
    },

    async updateMenuMeta(menuId, patch) {
      const row: { name?: string; slug?: string; archived?: boolean; position?: number } = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.slug !== undefined) row.slug = patch.slug;
      if (patch.archived !== undefined) row.archived = patch.archived;
      if (patch.position !== undefined) row.position = patch.position;
      if (Object.keys(row).length > 0) {
        const res = await client.from("menus").update(row).eq("id", menuId).select("id");
        const rows = must<{ id: string }[] | null>("Update menu", res);
        if (!rows?.length) throw new Error("Menu not found");
      }
      return requireMenu(menuId);
    },

    async saveMenuContent(menuId, content) {
      const { error } = await client.rpc("save_menu_content", { p_menu_id: menuId, p_content: content });
      if (error) throw rpcError("Save menu content", error);
      return requireMenu(menuId);
    },

    async publishMenu(menuId) {
      const { error } = await client.rpc("publish_menu", { p_menu_id: menuId });
      if (error) throw rpcError("Publish menu", error);
      return requireMenu(menuId);
    },

    async unpublishMenu(menuId) {
      const res = await client
        .from("menus")
        .update({ status: "draft", published_content: null, has_unpublished_changes: false })
        .eq("id", menuId)
        .select("id");
      const rows = must<{ id: string }[] | null>("Unpublish menu", res);
      if (!rows?.length) throw new Error("Menu not found");
      return requireMenu(menuId);
    },

    async getPublishedMenus(restaurantId) {
      const res = await client
        .from("menus")
        .select(`${MENU_WITH_COUNT}, published_content`)
        .eq("restaurant_id", restaurantId)
        .eq("status", "published")
        .eq("archived", false)
        .not("published_content", "is", null)
        .eq("menu_items.archived", false)
        .order("position", { ascending: true });
      const rows = must<MenuRow[] | null>("Load published menus", res) ?? [];
      return rows
        .filter((r): r is MenuRow & { published_content: MenuContent } => Boolean(r.published_content))
        .map((r) => ({ menu: toMenu(r), content: r.published_content }));
    },

    // -- images --------------------------------------------------------------
    async recordImage(restaurantId, storagePath, url, userId) {
      const res = await client
        .from("item_images")
        .insert({ restaurant_id: restaurantId, storage_path: storagePath, url, uploaded_by: userId });
      if (res.error) throw dbError("Record image", res.error);
    },

    // -- QR codes ------------------------------------------------------------
    async listQrCodes(restaurantId) {
      const res = await client
        .from("qr_codes")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("archived", false)
        .order("created_at", { ascending: true });
      return (must<QrRow[] | null>("List QR codes", res) ?? []).map(toQr);
    },

    async getQrCode(id) {
      const row = must<QrRow | null>("Load QR code", await client.from("qr_codes").select("*").eq("id", id).maybeSingle());
      return row ? toQr(row) : null;
    },

    async getQrByCode(code) {
      const row = must<QrRow | null>(
        "Load QR code",
        await client.from("qr_codes").select("*").eq("code", code).maybeSingle(),
      );
      return row ? toQr(row) : null;
    },

    async createQrCode(restaurantId, input) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await client
          .from("qr_codes")
          .insert({
            restaurant_id: restaurantId,
            code: generateQrCode(),
            name: input.name,
            menu_id: input.menuId,
            style: input.style,
          })
          .select("*")
          .single();
        if (isUniqueViolation(res.error, "qr_codes_code_key")) continue;
        return toQr(must<QrRow>("Create QR code", res));
      }
      throw new Error("Could not generate a unique QR code");
    },

    async updateQrCode(id, patch) {
      const row: { name?: string; menu_id?: string | null; style?: QrStyle; archived?: boolean } = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.menuId !== undefined) row.menu_id = patch.menuId;
      if (patch.style !== undefined) row.style = patch.style;
      if (patch.archived !== undefined) row.archived = patch.archived;
      if (Object.keys(row).length === 0) {
        const current = await repo.getQrCode(id);
        if (!current) throw new Error("QR code not found");
        return current;
      }
      const res = await client.from("qr_codes").update(row).eq("id", id).select("*").maybeSingle();
      const updated = must<QrRow | null>("Update QR code", res);
      if (!updated) throw new Error("QR code not found");
      return toQr(updated);
    },

    // -- analytics -----------------------------------------------------------
    async recordEvent(event) {
      const res = await client.from("analytics_events").insert({
        restaurant_id: event.restaurantId,
        type: event.type,
        menu_id: event.menuId,
        item_id: event.itemId,
        qr_code_id: event.qrCodeId,
        device: event.device,
        referrer_host: event.referrerHost,
        is_demo: event.isDemo,
        occurred_at: event.occurredAt,
      });
      if (res.error) throw dbError("Record event", res.error);
    },

    async listEvents(restaurantId, fromIso, toIso) {
      const rows = await fetchAll<EventRow>("Load analytics", (from, to) =>
        client
          .from("analytics_events")
          .select("id, restaurant_id, type, menu_id, item_id, qr_code_id, device, referrer_host, is_demo, occurred_at")
          .eq("restaurant_id", restaurantId)
          .gte("occurred_at", fromIso)
          .lte("occurred_at", toIso)
          .order("occurred_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      );
      return rows.map(toEvent);
    },

    // -- subscriptions -------------------------------------------------------
    async getSubscription(userId) {
      const row = must<SubscriptionRow | null>(
        "Load subscription",
        await client.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
      );
      return row ? toSubscription(row) : null;
    },

    async upsertSubscription(sub) {
      const res = await client.from("subscriptions").upsert(
        {
          user_id: sub.userId,
          plan: sub.plan,
          status: sub.status,
          source: sub.source,
          stripe_customer_id: sub.stripeCustomerId,
          stripe_subscription_id: sub.stripeSubscriptionId,
          current_period_end: sub.currentPeriodEnd,
          cancel_at_period_end: sub.cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (res.error) throw dbError("Save subscription", res.error);
    },

    async findUserIdByStripeCustomer(customerId) {
      const row = must<{ user_id: string } | null>(
        "Find subscription",
        await client.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle(),
      );
      return row?.user_id ?? null;
    },

    // -- activity ------------------------------------------------------------
    async logActivity(entry) {
      const res = await client.from("activity_log").insert({
        restaurant_id: entry.restaurantId,
        user_id: entry.userId,
        kind: entry.kind,
        message: entry.message,
      });
      if (res.error) throw dbError("Log activity", res.error);
    },

    async listActivity(restaurantId, limit) {
      const res = await client
        .from("activity_log")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(Math.max(0, limit));
      return (must<ActivityRow[] | null>("List activity", res) ?? []).map(toActivity);
    },
  };
  return repo;
}
