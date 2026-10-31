import type { MenuViewRestaurant } from "@/components/public-menu/menu-view";
import type { Allergen, DietaryTag, MenuContent, MenuItem, TemplateId } from "./domain";
import { getTemplate } from "./templates";

// Static sample data used by the marketing site. Mirrors the local demo seed
// ("Saffron & Sage") so the landing page and /m/saffron-sage feel consistent.

export const SAMPLE_RESTAURANT: MenuViewRestaurant = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Saffron & Sage",
  tagline: "Mediterranean kitchen & natural wine",
  logoUrl: null,
  coverUrl: "/images/covers/modern-bistro.jpg",
  address: "214 Alder Street, Portland, OR",
  phone: "(503) 555-0142",
  website: "",
  slug: "saffron-sage",
};

export const SAMPLE_MENUS = [
  { id: "5a3f0000-0000-4000-8000-00000000d001", name: "Dinner", slug: "dinner" },
  { id: "5a3f0000-0000-4000-8000-00000000d002", name: "Drinks", slug: "drinks" },
];

const img = (name: string) => `/images/dishes/${name}.jpg`;

const CAT = {
  small: "5a3f0000-0000-4000-8000-0000000c0001",
  mains: "5a3f0000-0000-4000-8000-0000000c0002",
  desserts: "5a3f0000-0000-4000-8000-0000000c0003",
  drinks: "5a3f0000-0000-4000-8000-0000000c0004",
} as const;

type ItemSeed = {
  id: string;
  name: string;
  description: string;
  price: number;
  dietary: DietaryTag[];
  allergens: Allergen[];
  imageUrl: string | null;
  featured?: boolean;
  available?: boolean;
};

function items(categoryId: string, seeds: ItemSeed[]): MenuItem[] {
  return seeds.map((s, position) => ({
    archived: false,
    featured: false,
    available: true,
    ...s,
    categoryId,
    position,
  }));
}

export const SAMPLE_MENU: MenuContent = {
  name: "Dinner",
  description: "Served nightly from 5pm. Pasta rolled by hand every morning.",
  currency: "USD",
  categories: [
    {
      id: CAT.small,
      name: "Small Plates",
      description: "Made for sharing.",
      position: 0,
      items: items(CAT.small, [
        {
          id: "5a3f0000-0000-4000-8000-0000000a0001",
          name: "Burrata & Heirloom Tomatoes",
          description: "Puglian burrata, late-summer tomatoes, basil oil, Maldon salt.",
          price: 1600,
          dietary: ["vegetarian", "gluten-free"],
          allergens: ["milk"],
          imageUrl: img("burrata"),
          featured: true,
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0002",
          name: "Charred Octopus",
          description: "Smoked paprika potatoes, salsa verde, lemon.",
          price: 2200,
          dietary: ["gluten-free", "dairy-free"],
          allergens: ["molluscs"],
          imageUrl: img("octopus"),
        },
      ]),
    },
    {
      id: CAT.mains,
      name: "Pasta & Fire",
      description: "Cooked over oak and olive wood.",
      position: 1,
      items: items(CAT.mains, [
        {
          id: "5a3f0000-0000-4000-8000-0000000a0003",
          name: "Pappardelle Ragù",
          description: "Eight-hour beef & pork ragù, Parmigiano Reggiano.",
          price: 2600,
          dietary: [],
          allergens: ["gluten", "eggs", "milk", "celery"],
          imageUrl: img("pappardelle"),
          featured: true,
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0004",
          name: "Saffron Risotto",
          description: "Carnaroli rice, saffron, crispy sage.",
          price: 2400,
          dietary: ["vegetarian", "gluten-free"],
          allergens: ["milk", "sulphites"],
          imageUrl: img("risotto"),
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0005",
          name: "Whole Grilled Branzino",
          description: "Lemon, oregano, charred greens.",
          price: 3400,
          dietary: ["gluten-free", "dairy-free"],
          allergens: ["fish"],
          imageUrl: img("branzino"),
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0006",
          name: "Wood-fired Margherita",
          description: "San Marzano tomato, fior di latte, basil.",
          price: 1800,
          dietary: ["vegetarian"],
          allergens: ["gluten", "milk"],
          imageUrl: img("margherita"),
          available: false,
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0007",
          name: "Dry-aged Ribeye",
          description: "45-day aged, rosemary jus, served medium-rare.",
          price: 4800,
          dietary: ["gluten-free"],
          allergens: ["sulphites"],
          imageUrl: img("steak"),
        },
      ]),
    },
    {
      id: CAT.desserts,
      name: "Desserts",
      description: "",
      position: 2,
      items: items(CAT.desserts, [
        {
          id: "5a3f0000-0000-4000-8000-0000000a0008",
          name: "Tiramisu",
          description: "Mascarpone, espresso-soaked savoiardi, cocoa.",
          price: 1100,
          dietary: ["vegetarian"],
          allergens: ["gluten", "eggs", "milk"],
          imageUrl: img("tiramisu"),
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a0009",
          name: "Olive Oil Cake",
          description: "Blood orange, crème fraîche, pistachio.",
          price: 1000,
          dietary: ["vegetarian"],
          allergens: ["gluten", "eggs", "milk", "tree-nuts"],
          imageUrl: img("olive-oil-cake"),
        },
      ]),
    },
    {
      id: CAT.drinks,
      name: "Drinks",
      description: "Aperitivo hour 4 – 6pm.",
      position: 3,
      items: items(CAT.drinks, [
        {
          id: "5a3f0000-0000-4000-8000-0000000a000a",
          name: "Saffron Spritz",
          description: "Aperitivo, saffron cordial, prosecco, orange.",
          price: 1400,
          dietary: ["vegan"],
          allergens: ["sulphites"],
          imageUrl: img("spritz"),
        },
        {
          id: "5a3f0000-0000-4000-8000-0000000a000b",
          name: "Oat Flat White",
          description: "Double ristretto, steamed oat milk.",
          price: 550,
          dietary: ["vegan", "dairy-free"],
          allergens: ["gluten"],
          imageUrl: img("latte"),
        },
      ]),
    },
  ],
};

/** Signature dishes that some templates feature but the base menu doesn't include. */
const SIGNATURE_DISHES: Record<string, Omit<ItemSeed, "id">> = {
  [img("smash-burger")]: {
    name: "Double Smash Burger",
    description: "Two crispy-edged patties, American cheese, pickles, house sauce.",
    price: 1700,
    dietary: [],
    allergens: ["gluten", "milk", "eggs", "mustard", "sesame"],
    imageUrl: img("smash-burger"),
  },
  [img("poke-bowl")]: {
    name: "Tuna Poke Bowl",
    description: "Sushi rice, avocado, edamame, sesame-ginger dressing.",
    price: 1900,
    dietary: ["dairy-free"],
    allergens: ["fish", "soy", "sesame"],
    imageUrl: img("poke-bowl"),
  },
  [img("croissant")]: {
    name: "Butter Croissant",
    description: "Laminated in-house over three days.",
    price: 450,
    dietary: ["vegetarian"],
    allergens: ["gluten", "milk", "eggs"],
    imageUrl: img("croissant"),
  },
};

/**
 * Sample restaurant + menu adapted to a template: uses the template's cover and
 * leads with its signature dish (moved to the top, or swapped in for the first
 * featured item when the base menu doesn't have it).
 */
export function sampleForTemplate(templateId: TemplateId): { restaurant: MenuViewRestaurant; content: MenuContent } {
  const template = getTemplate(templateId);
  const restaurant: MenuViewRestaurant = { ...SAMPLE_RESTAURANT, coverUrl: template.cover };
  const dish = template.sampleDish;

  const categories = SAMPLE_MENU.categories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) }));
  const first = categories[0];
  const existing = categories.flatMap((c) => c.items).find((i) => i.imageUrl === dish);

  if (existing) {
    for (const c of categories) c.items = c.items.filter((i) => i.id !== existing.id);
    first.items.unshift({ ...existing, categoryId: first.id, featured: true, available: true });
  } else {
    const signature = SIGNATURE_DISHES[dish];
    const target = first.items.find((i) => i.featured) ?? first.items[0];
    if (signature && target) {
      first.items = [
        { ...target, ...signature, featured: true, available: true },
        ...first.items.filter((i) => i.id !== target.id),
      ];
    }
  }
  for (const c of categories) c.items = c.items.map((i, position) => ({ ...i, position }));

  return { restaurant, content: { ...SAMPLE_MENU, categories } };
}
