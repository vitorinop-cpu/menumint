import type {
  Activity,
  AnalyticsEvent,
  Branding,
  BrandingInput,
  Currency,
  Membership,
  Menu,
  MenuContent,
  MenuTree,
  Profile,
  PublishedMenu,
  QrCode,
  QrStyle,
  Restaurant,
  Role,
  Subscription,
} from "../domain";

export type RestaurantInput = Pick<
  Restaurant,
  "slug" | "name" | "tagline" | "description" | "cuisine" | "address" | "phone" | "website" | "currency" | "logoUrl" | "coverUrl"
>;

/**
 * Storage boundary. Implementations are "dumb" persistence: authorization and
 * plan entitlements are enforced in src/lib/services before calling into a repo.
 * The Supabase implementation additionally relies on Row Level Security.
 */
export interface Repo {
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, patch: Partial<Pick<Profile, "fullName" | "onboarding">>): Promise<void>;

  listRestaurantsForUser(userId: string): Promise<(Restaurant & { role: Role })[]>;
  getRestaurant(id: string): Promise<Restaurant | null>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | null>;
  isSlugTaken(slug: string, exceptRestaurantId?: string): Promise<boolean>;
  countRestaurantsOwned(userId: string): Promise<number>;
  createRestaurant(ownerId: string, input: RestaurantInput, branding: BrandingInput): Promise<Restaurant>;
  updateRestaurant(id: string, patch: Partial<RestaurantInput>): Promise<Restaurant>;

  getMembership(userId: string, restaurantId: string): Promise<Membership | null>;
  listMembers(restaurantId: string): Promise<Membership[]>;
  addMemberByEmail(restaurantId: string, email: string, role: Role): Promise<Membership | "not_found" | "exists">;
  removeMember(restaurantId: string, userId: string): Promise<void>;

  getBranding(restaurantId: string): Promise<Branding | null>;
  saveBranding(restaurantId: string, input: BrandingInput): Promise<Branding>;

  listMenus(restaurantId: string): Promise<Menu[]>;
  getMenu(menuId: string): Promise<Menu | null>;
  getMenuTree(menuId: string): Promise<MenuTree | null>;
  createMenu(
    restaurantId: string,
    input: { name: string; slug: string; description: string; currency: Currency },
    content?: MenuContent,
  ): Promise<Menu>;
  updateMenuMeta(menuId: string, patch: Partial<Pick<Menu, "name" | "slug" | "archived" | "position">>): Promise<Menu>;
  saveMenuContent(menuId: string, content: MenuContent): Promise<Menu>;
  publishMenu(menuId: string): Promise<Menu>;
  unpublishMenu(menuId: string): Promise<Menu>;
  getPublishedMenus(restaurantId: string): Promise<PublishedMenu[]>;

  recordImage(restaurantId: string, storagePath: string, url: string, userId: string): Promise<void>;

  listQrCodes(restaurantId: string): Promise<QrCode[]>;
  getQrCode(id: string): Promise<QrCode | null>;
  getQrByCode(code: string): Promise<QrCode | null>;
  createQrCode(restaurantId: string, input: { name: string; menuId: string | null; style: QrStyle }): Promise<QrCode>;
  updateQrCode(id: string, patch: Partial<Pick<QrCode, "name" | "menuId" | "style" | "archived">>): Promise<QrCode>;

  recordEvent(event: Omit<AnalyticsEvent, "id">): Promise<void>;
  listEvents(restaurantId: string, fromIso: string, toIso: string): Promise<AnalyticsEvent[]>;

  getSubscription(userId: string): Promise<Subscription | null>;
  upsertSubscription(sub: Omit<Subscription, "updatedAt">): Promise<void>;
  findUserIdByStripeCustomer(customerId: string): Promise<string | null>;

  logActivity(entry: Omit<Activity, "id" | "createdAt">): Promise<void>;
  listActivity(restaurantId: string, limit: number): Promise<Activity[]>;
}
