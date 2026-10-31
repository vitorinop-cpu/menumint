import { z } from "zod";
import { ALLERGENS, CURRENCIES, DIETARY_TAGS } from "./domain";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour");
const templateId = z.enum([
  "modern-bistro",
  "classic-elegance",
  "minimal-cafe",
  "bold-street-food",
  "luxury-dining",
  "coastal-fresh",
]);
const fontId = z.enum([
  "fraunces",
  "playfair",
  "cormorant",
  "dm-serif",
  "archivo-black",
  "space-grotesk",
  "inter",
  "dm-sans",
  "lora",
  "geist",
]);
const mediaUrl = z
  .string()
  .max(600)
  .refine((v) => v.startsWith("/api/uploads/") || v.startsWith("/images/") || /^https:\/\//.test(v), "Invalid image URL")
  .nullable();

export const slugSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(48, "At most 48 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single dashes only");

export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "dashboard", "login", "signup", "settings", "billing", "menumint", "demo", "new", "q", "m",
]);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Too long")
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

/** hCaptcha token (optional so forms keep working when captcha is disabled). */
const captchaToken = z.string().trim().max(20_000).optional();

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us your name").max(80),
  email: emailSchema,
  password: passwordSchema,
  captchaToken,
});
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  captchaToken,
});
export const forgotSchema = z.object({ email: emailSchema, captchaToken });
export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const restaurantInfoSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name is required").max(80),
  slug: slugSchema,
  tagline: z.string().trim().max(120).default(""),
  address: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(40).default(""),
  currency: z.enum(CURRENCIES),
});

export const restaurantUpdateSchema = restaurantInfoSchema.extend({
  description: z.string().trim().max(600).default(""),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Start with http:// or https://")
    .default(""),
  cuisine: z.string().trim().max(60).default(""),
  logoUrl: mediaUrl,
  coverUrl: mediaUrl,
});

export const brandingSchema = z.object({
  template: templateId,
  primaryColor: hex,
  secondaryColor: hex,
  backgroundColor: hex,
  headingFont: fontId,
  bodyFont: fontId,
  buttonStyle: z.enum(["pill", "rounded", "square"]),
  cardStyle: z.enum(["elevated", "outlined", "flat", "minimal"]),
  radius: z.number().int().min(0).max(32),
  background: z.enum(["solid", "gradient", "paper"]),
  categoryNav: z.enum(["pills", "underline"]),
  itemLayout: z.enum(["list", "grid"]),
  headerStyle: z.enum(["cover", "centered", "minimal"]),
  theme: z.enum(["light", "dark"]),
  showImages: z.boolean(),
});

const dietaryIds = DIETARY_TAGS.map((d) => d.id) as [string, ...string[]];
const allergenIds = ALLERGENS.map((a) => a.id) as [string, ...string[]];

export const menuItemSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string().trim().min(1, "Item name is required").max(100),
  description: z.string().trim().max(500),
  price: z.number().int().min(0).max(100_000_000),
  available: z.boolean(),
  featured: z.boolean(),
  archived: z.boolean(),
  dietary: z.array(z.enum(dietaryIds)).max(10),
  allergens: z.array(z.enum(allergenIds)).max(14),
  imageUrl: mediaUrl,
  position: z.number().int().min(0),
});

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Category name is required").max(80),
  description: z.string().trim().max(300),
  position: z.number().int().min(0),
  items: z.array(menuItemSchema).max(300),
});

export const menuContentSchema = z.object({
  name: z.string().trim().min(1, "Menu name is required").max(80),
  description: z.string().trim().max(300),
  currency: z.enum(CURRENCIES),
  categories: z.array(categorySchema).max(60),
});

export const qrStyleSchema = z.object({
  fg: hex,
  bg: hex,
  dotStyle: z.enum(["square", "rounded", "dots"]),
  cornerStyle: z.enum(["square", "rounded", "circle"]),
  logo: z.boolean(),
  frameLabel: z.string().trim().max(32),
});

export const qrInputSchema = z.object({
  name: z.string().trim().min(1, "Name your QR code").max(60),
  menuId: z.uuid().nullable(),
  style: qrStyleSchema,
});

export const trackSchema = z.object({
  type: z.enum(["menu_view", "item_view"]),
  restaurantId: z.uuid(),
  menuId: z.uuid().nullable().optional(),
  itemId: z.uuid().nullable().optional(),
});
