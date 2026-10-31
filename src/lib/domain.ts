// Shared domain types used by both the local demo store and the Supabase adapter.

export type PlanId = "free" | "starter" | "pro" | "business";
export type Role = "owner" | "editor";

export type TemplateId =
  | "modern-bistro"
  | "classic-elegance"
  | "minimal-cafe"
  | "bold-street-food"
  | "luxury-dining"
  | "coastal-fresh";

export type FontId =
  | "fraunces"
  | "playfair"
  | "cormorant"
  | "dm-serif"
  | "archivo-black"
  | "space-grotesk"
  | "inter"
  | "dm-sans"
  | "lora"
  | "geist";

export const DIETARY_TAGS = [
  { id: "vegetarian", label: "Vegetarian", short: "V" },
  { id: "vegan", label: "Vegan", short: "VG" },
  { id: "gluten-free", label: "Gluten-free", short: "GF" },
  { id: "dairy-free", label: "Dairy-free", short: "DF" },
  { id: "spicy", label: "Spicy", short: "🌶" },
  { id: "halal", label: "Halal", short: "H" },
  { id: "nut-free", label: "Nut-free", short: "NF" },
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number]["id"];

// The 14 major allergens recognised in EU/UK food labelling.
export const ALLERGENS = [
  { id: "gluten", label: "Gluten" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "peanuts", label: "Peanuts" },
  { id: "soy", label: "Soy" },
  { id: "milk", label: "Milk" },
  { id: "tree-nuts", label: "Tree nuts" },
  { id: "celery", label: "Celery" },
  { id: "mustard", label: "Mustard" },
  { id: "sesame", label: "Sesame" },
  { id: "sulphites", label: "Sulphites" },
  { id: "lupin", label: "Lupin" },
  { id: "molluscs", label: "Molluscs" },
] as const;
export type Allergen = (typeof ALLERGENS)[number]["id"];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "JPY", "CHF", "SEK"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CUISINES = [
  "Mediterranean",
  "Italian",
  "French",
  "Café & Bakery",
  "American",
  "Mexican",
  "Japanese",
  "Thai",
  "Indian",
  "Middle Eastern",
  "Seafood",
  "Street Food",
  "Vegan & Plant-based",
  "Fine Dining",
  "Bar & Cocktails",
  "Other",
] as const;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
}

export interface OnboardingDraft {
  step: number;
  data: Partial<{
    name: string;
    slug: string;
    tagline: string;
    address: string;
    phone: string;
    currency: Currency;
    cuisine: string;
    logoUrl: string | null;
    coverUrl: string | null;
    template: TemplateId;
    primaryColor: string;
    secondaryColor: string;
    headingFont: FontId;
    bodyFont: FontId;
    menuName: string;
    firstCategory: string;
    firstItems: { name: string; price: string; description: string }[];
    restaurantId: string;
    menuId: string;
    qrCodeId: string;
  }>;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  onboarding: OnboardingDraft | null;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  website: string;
  currency: Currency;
  logoUrl: string | null;
  coverUrl: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  restaurantId: string;
  userId: string;
  role: Role;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Branding {
  restaurantId: string;
  template: TemplateId;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  headingFont: FontId;
  bodyFont: FontId;
  buttonStyle: "pill" | "rounded" | "square";
  cardStyle: "elevated" | "outlined" | "flat" | "minimal";
  radius: number;
  background: "solid" | "gradient" | "paper";
  categoryNav: "pills" | "underline";
  itemLayout: "list" | "grid";
  headerStyle: "cover" | "centered" | "minimal";
  theme: "light" | "dark";
  showImages: boolean;
  updatedAt: string;
}

export type BrandingInput = Omit<Branding, "restaurantId" | "updatedAt">;

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // minor units (cents)
  available: boolean;
  featured: boolean;
  archived: boolean;
  dietary: DietaryTag[];
  allergens: Allergen[];
  imageUrl: string | null;
  position: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  position: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description: string;
  currency: Currency;
  status: "draft" | "published";
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  archived: boolean;
  position: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuContent {
  name: string;
  description: string;
  currency: Currency;
  categories: Category[];
}

export interface MenuTree extends MenuContent {
  menu: Menu;
}

export interface PublishedMenu {
  menu: Menu;
  content: MenuContent;
}

export type QrDotStyle = "square" | "rounded" | "dots";
export type QrCornerStyle = "square" | "rounded" | "circle";

export interface QrStyle {
  fg: string;
  bg: string;
  dotStyle: QrDotStyle;
  cornerStyle: QrCornerStyle;
  logo: boolean;
  frameLabel: string;
}

export interface QrCode {
  id: string;
  restaurantId: string;
  code: string;
  name: string;
  menuId: string | null; // null = restaurant landing (default published menu)
  style: QrStyle;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsEventType = "menu_view" | "qr_scan" | "item_view";
export type DeviceClass = "mobile" | "tablet" | "desktop" | "unknown";

export interface AnalyticsEvent {
  id: string;
  restaurantId: string;
  type: AnalyticsEventType;
  menuId: string | null;
  itemId: string | null;
  qrCodeId: string | null;
  device: DeviceClass;
  referrerHost: string | null;
  isDemo: boolean;
  occurredAt: string;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid"
  | "none";

export interface Subscription {
  userId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  source: "default" | "stripe" | "demo";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
}

export interface Activity {
  id: string;
  restaurantId: string;
  userId: string | null;
  kind:
    | "restaurant_created"
    | "menu_created"
    | "menu_published"
    | "menu_unpublished"
    | "menu_duplicated"
    | "menu_archived"
    | "branding_updated"
    | "qr_created"
    | "qr_updated"
    | "member_added"
    | "member_removed"
    | "plan_changed";
  message: string;
  createdAt: string;
}
