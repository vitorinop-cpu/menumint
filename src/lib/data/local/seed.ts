import { randomBytes, scryptSync, randomUUID } from "node:crypto";
import type { LocalDb, ItemRow } from "./store";
import type { AnalyticsEvent, DeviceClass, MenuContent } from "@/lib/domain";
import { getTemplate } from "@/lib/templates";

export const DEMO_EMAIL = "demo@menumint.app";
export const DEMO_PASSWORD = "mint-demo-2026";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

type SeedItem = Omit<ItemRow, "id" | "menuId" | "categoryId" | "position" | "archived" | "featured" | "available"> &
  Partial<Pick<ItemRow, "featured" | "available">>;

const img = (n: string) => `/images/dishes/${n}.jpg`;

const DINNER: { name: string; description: string; items: SeedItem[] }[] = [
  {
    name: "Small Plates",
    description: "Made for sharing, best with a glass of something cold.",
    items: [
      { name: "Burrata & Heirloom Tomatoes", description: "Puglian burrata, late-summer tomatoes, basil oil, Maldon salt.", price: 1600, dietary: ["vegetarian", "gluten-free"], allergens: ["milk"], imageUrl: img("burrata"), featured: true },
      { name: "Charred Octopus", description: "Smoked paprika potatoes, salsa verde, lemon.", price: 2200, dietary: ["gluten-free", "dairy-free"], allergens: ["molluscs"], imageUrl: img("octopus") },
      { name: "Whipped Feta & Hot Honey", description: "Za'atar flatbread, Calabrian chilli honey.", price: 1200, dietary: ["vegetarian"], allergens: ["milk", "gluten", "sesame"], imageUrl: null },
      { name: "Crispy Artichokes", description: "Preserved lemon aioli, parsley, sea salt.", price: 1300, dietary: ["vegetarian", "gluten-free"], allergens: ["eggs"], imageUrl: null },
    ],
  },
  {
    name: "Pasta & Grains",
    description: "Pasta rolled by hand every morning.",
    items: [
      { name: "Pappardelle Ragù", description: "Eight-hour beef & pork ragù, Parmigiano Reggiano.", price: 2600, dietary: [], allergens: ["gluten", "eggs", "milk", "celery"], imageUrl: img("pappardelle"), featured: true },
      { name: "Saffron Risotto", description: "Carnaroli rice, Iranian saffron, crispy sage.", price: 2400, dietary: ["vegetarian", "gluten-free"], allergens: ["milk", "sulphites"], imageUrl: img("risotto") },
      { name: "Wild Mushroom Orzo", description: "Chanterelles, thyme, brown butter.", price: 2300, dietary: ["vegetarian"], allergens: ["gluten", "milk"], imageUrl: null, available: false },
    ],
  },
  {
    name: "From the Fire",
    description: "Cooked over oak and olive wood.",
    items: [
      { name: "Whole Grilled Branzino", description: "Lemon, oregano, charred greens.", price: 3400, dietary: ["gluten-free", "dairy-free"], allergens: ["fish"], imageUrl: img("branzino") },
      { name: "Wood-fired Margherita", description: "San Marzano tomato, fior di latte, basil.", price: 1800, dietary: ["vegetarian"], allergens: ["gluten", "milk"], imageUrl: img("margherita") },
      { name: "Dry-aged Ribeye", description: "45-day aged, rosemary jus, served medium-rare.", price: 4800, dietary: ["gluten-free"], allergens: ["sulphites"], imageUrl: img("steak") },
    ],
  },
  {
    name: "Desserts",
    description: "",
    items: [
      { name: "Tiramisu", description: "Mascarpone, espresso-soaked savoiardi, cocoa.", price: 1100, dietary: ["vegetarian"], allergens: ["gluten", "eggs", "milk"], imageUrl: img("tiramisu") },
      { name: "Olive Oil Cake", description: "Blood orange, crème fraîche, pistachio.", price: 1000, dietary: ["vegetarian"], allergens: ["gluten", "eggs", "milk", "tree-nuts"], imageUrl: img("olive-oil-cake") },
    ],
  },
];

const DRINKS: typeof DINNER = [
  {
    name: "Cocktails",
    description: "",
    items: [
      { name: "Saffron Spritz", description: "Aperitivo, saffron cordial, prosecco, orange.", price: 1400, dietary: ["vegan"], allergens: ["sulphites"], imageUrl: img("spritz"), featured: true },
      { name: "Negroni Bianco", description: "Gin, bianco vermouth, Suze.", price: 1500, dietary: ["vegan"], allergens: ["sulphites"], imageUrl: null },
    ],
  },
  {
    name: "Coffee",
    description: "Single-origin beans from our neighbours at Kiln Roasters.",
    items: [
      { name: "Flat White", description: "Double ristretto, silky milk.", price: 500, dietary: ["vegetarian"], allergens: ["milk"], imageUrl: img("latte") },
      { name: "Espresso", description: "", price: 350, dietary: ["vegan"], allergens: [], imageUrl: null },
    ],
  },
];

const BRUNCH: typeof DINNER = [
  {
    name: "Brunch",
    description: "Saturdays & Sundays, 9am – 2pm.",
    items: [
      { name: "Butter Croissant", description: "Laminated in-house, 72-hour dough.", price: 450, dietary: ["vegetarian"], allergens: ["gluten", "milk", "eggs"], imageUrl: img("croissant") },
      { name: "Shakshuka", description: "Spiced tomato, baked eggs, labneh, sourdough.", price: 1600, dietary: ["vegetarian"], allergens: ["eggs", "milk", "gluten"], imageUrl: null },
      { name: "Tuna Poke Bowl", description: "Sushi rice, avocado, edamame, sesame-ginger dressing.", price: 1900, dietary: ["dairy-free"], allergens: ["fish", "soy", "sesame"], imageUrl: img("poke-bowl") },
    ],
  },
];

function addMenu(
  db: LocalDb,
  restaurantId: string,
  name: string,
  slug: string,
  description: string,
  position: number,
  cats: typeof DINNER,
  publish: boolean,
  now: string,
) {
  const menuId = randomUUID();
  const content: MenuContent = { name, description, currency: "USD", categories: [] };
  cats.forEach((c, ci) => {
    const categoryId = randomUUID();
    db.categories.push({ id: categoryId, menuId, name: c.name, description: c.description, position: ci });
    const items: ItemRow[] = c.items.map((it, ii) => ({
      id: randomUUID(),
      menuId,
      categoryId,
      position: ii,
      archived: false,
      featured: it.featured ?? false,
      available: it.available ?? true,
      name: it.name,
      description: it.description,
      price: it.price,
      dietary: it.dietary,
      allergens: it.allergens,
      imageUrl: it.imageUrl,
    }));
    db.items.push(...items);
    content.categories.push({
      id: categoryId,
      name: c.name,
      description: c.description,
      position: ci,
      items: items.map(({ menuId: _m, ...rest }) => ({ ...rest, dietary: rest.dietary as never, allergens: rest.allergens as never })),
    });
  });
  db.menus.push({
    id: menuId,
    restaurantId,
    name,
    slug,
    description,
    currency: "USD",
    status: publish ? "published" : "draft",
    hasUnpublishedChanges: false,
    publishedAt: publish ? now : null,
    archived: false,
    position,
    createdAt: now,
    updatedAt: now,
    publishedContent: publish ? content : null,
  });
  return { menuId, content };
}

/** Deterministic pseudo-random so the demo looks the same on every machine. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildSeed(db: LocalDb) {
  const now = new Date();
  const nowIso = now.toISOString();
  const userId = randomUUID();
  const restaurantId = randomUUID();

  db.users.push({ id: userId, email: DEMO_EMAIL, passwordHash: hashPassword(DEMO_PASSWORD), createdAt: nowIso });
  db.profiles.push({ id: userId, email: DEMO_EMAIL, fullName: "Elena Marchetti", onboarding: null, createdAt: nowIso });
  db.subscriptions.push({
    userId,
    plan: "pro",
    status: "active",
    source: "demo",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    updatedAt: nowIso,
  });

  db.restaurants.push({
    id: restaurantId,
    ownerId: userId,
    slug: "saffron-sage",
    name: "Saffron & Sage",
    tagline: "Mediterranean kitchen & natural wine",
    description: "A neighbourhood bistro cooking over open fire, with pasta made by hand every morning.",
    cuisine: "Mediterranean",
    address: "214 Alder Street, Portland, OR",
    phone: "(503) 555-0142",
    website: "",
    currency: "USD",
    logoUrl: null,
    coverUrl: "/images/covers/modern-bistro.jpg",
    isDemo: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  db.memberships.push({ restaurantId, userId, role: "owner", createdAt: nowIso });
  db.branding.push({ restaurantId, ...getTemplate("modern-bistro").branding, updatedAt: nowIso });

  const dinner = addMenu(db, restaurantId, "Dinner", "dinner", "Served nightly from 5pm.", 0, DINNER, true, nowIso);
  const drinks = addMenu(db, restaurantId, "Drinks", "drinks", "Aperitivo hour 4 – 6pm.", 1, DRINKS, true, nowIso);
  addMenu(db, restaurantId, "Weekend Brunch", "weekend-brunch", "Saturdays & Sundays.", 2, BRUNCH, false, nowIso);

  const qrTable = randomUUID();
  const qrWindow = randomUUID();
  db.qrCodes.push(
    {
      id: qrTable,
      restaurantId,
      code: "sgtable1",
      name: "Table tents",
      menuId: null,
      style: { fg: "#241B18", bg: "#FFFFFF", dotStyle: "rounded", cornerStyle: "rounded", logo: false, frameLabel: "Scan for menu" },
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: qrWindow,
      restaurantId,
      code: "sgdrink1",
      name: "Bar — drinks list",
      menuId: drinks.menuId,
      style: { fg: "#9A3F1C", bg: "#FFF9F2", dotStyle: "dots", cornerStyle: "circle", logo: false, frameLabel: "Drinks" },
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  );

  // Clearly-flagged sample analytics (isDemo = true) so the dashboard has something to show.
  const rand = rng(42);
  const dinnerItems = dinner.content.categories.flatMap((c) => c.items);
  const drinkItems = drinks.content.categories.flatMap((c) => c.items);
  const devices: DeviceClass[] = ["mobile", "mobile", "mobile", "mobile", "tablet", "desktop"];
  const events: AnalyticsEvent[] = [];
  const days = 45;
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now.getTime() - d * 86400000);
    const weekend = [0, 5, 6].includes(day.getDay());
    const trend = 1 + (days - d) / days;
    const views = Math.round((14 + rand() * 10) * trend * (weekend ? 1.6 : 1));
    for (let v = 0; v < views; v++) {
      const at = new Date(day);
      at.setHours(11 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      if (at > now) continue;
      const fromQr = rand() < 0.62;
      const isDrinks = rand() < 0.3;
      const qrId = fromQr ? (isDrinks ? qrWindow : qrTable) : null;
      const menuId = isDrinks ? drinks.menuId : dinner.menuId;
      const base = {
        restaurantId,
        menuId,
        qrCodeId: qrId,
        device: devices[Math.floor(rand() * devices.length)],
        referrerHost: fromQr ? null : rand() < 0.5 ? "instagram.com" : "google.com",
        isDemo: true,
      };
      if (fromQr) events.push({ id: randomUUID(), type: "qr_scan", itemId: null, occurredAt: at.toISOString(), ...base });
      events.push({ id: randomUUID(), type: "menu_view", itemId: null, occurredAt: at.toISOString(), ...base });
      const pool = isDrinks ? drinkItems : dinnerItems;
      const opens = Math.floor(rand() * 3);
      for (let o = 0; o < opens; o++) {
        // Skew popularity toward the first items so the ranking is meaningful.
        const idx = Math.min(pool.length - 1, Math.floor(rand() * rand() * pool.length));
        events.push({ id: randomUUID(), type: "item_view", itemId: pool[idx].id, occurredAt: at.toISOString(), ...base, qrCodeId: null });
      }
    }
  }
  db.events.push(...events);

  const ago = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  db.activity.push(
    { id: randomUUID(), restaurantId, userId, kind: "restaurant_created", message: "Created Saffron & Sage", createdAt: ago(24 * 40) },
    { id: randomUUID(), restaurantId, userId, kind: "menu_published", message: "Published “Dinner”", createdAt: ago(30) },
    { id: randomUUID(), restaurantId, userId, kind: "qr_created", message: "Created QR code “Bar — drinks list”", createdAt: ago(20) },
    { id: randomUUID(), restaurantId, userId, kind: "menu_published", message: "Published “Drinks”", createdAt: ago(6) },
    { id: randomUUID(), restaurantId, userId, kind: "menu_created", message: "Started a draft: “Weekend Brunch”", createdAt: ago(2) },
  );
}
