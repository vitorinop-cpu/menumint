import type { BrandingInput, FontId, TemplateId } from "./domain";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  cover: string;
  sampleDish: string;
  branding: BrandingInput;
}

export const FONT_OPTIONS: { id: FontId; label: string; kind: "serif" | "sans" | "display"; cssVar: string }[] = [
  { id: "fraunces", label: "Fraunces", kind: "serif", cssVar: "--font-fraunces" },
  { id: "playfair", label: "Playfair Display", kind: "serif", cssVar: "--font-playfair" },
  { id: "cormorant", label: "Cormorant Garamond", kind: "serif", cssVar: "--font-cormorant" },
  { id: "dm-serif", label: "DM Serif Display", kind: "serif", cssVar: "--font-dm-serif" },
  { id: "lora", label: "Lora", kind: "serif", cssVar: "--font-lora" },
  { id: "archivo-black", label: "Archivo Black", kind: "display", cssVar: "--font-archivo-black" },
  { id: "space-grotesk", label: "Space Grotesk", kind: "sans", cssVar: "--font-space-grotesk" },
  { id: "inter", label: "Inter", kind: "sans", cssVar: "--font-inter" },
  { id: "dm-sans", label: "DM Sans", kind: "sans", cssVar: "--font-dm-sans" },
  { id: "geist", label: "Geist", kind: "sans", cssVar: "--font-geist" },
];

export function fontFamily(id: FontId) {
  const f = FONT_OPTIONS.find((o) => o.id === id) ?? FONT_OPTIONS[0];
  const fallback = f.kind === "serif" ? "Georgia, serif" : "system-ui, sans-serif";
  return `var(${f.cssVar}), ${fallback}`;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "modern-bistro",
    name: "Modern Bistro",
    description: "Warm terracotta, editorial serif headings and soft paper texture.",
    cover: "/images/covers/modern-bistro.jpg",
    sampleDish: "/images/dishes/burrata.jpg",
    branding: {
      template: "modern-bistro",
      primaryColor: "#C8572B",
      secondaryColor: "#E8BA77",
      backgroundColor: "#FFF9F2",
      headingFont: "fraunces",
      bodyFont: "dm-sans",
      buttonStyle: "pill",
      cardStyle: "elevated",
      radius: 18,
      background: "paper",
      categoryNav: "pills",
      itemLayout: "list",
      headerStyle: "cover",
      theme: "light",
      showImages: true,
    },
  },
  {
    id: "classic-elegance",
    name: "Classic Elegance",
    description: "Brasserie-inspired typography, burgundy ink and gilded details.",
    cover: "/images/covers/classic-elegance.jpg",
    sampleDish: "/images/dishes/branzino.jpg",
    branding: {
      template: "classic-elegance",
      primaryColor: "#7A2E2E",
      secondaryColor: "#B8944F",
      backgroundColor: "#FBF6EC",
      headingFont: "cormorant",
      bodyFont: "lora",
      buttonStyle: "square",
      cardStyle: "minimal",
      radius: 2,
      background: "paper",
      categoryNav: "underline",
      itemLayout: "list",
      headerStyle: "centered",
      theme: "light",
      showImages: false,
    },
  },
  {
    id: "minimal-cafe",
    name: "Minimal Café",
    description: "Airy Scandinavian layout with clean sans-serif and mint accents.",
    cover: "/images/covers/minimal-cafe.jpg",
    sampleDish: "/images/dishes/croissant.jpg",
    branding: {
      template: "minimal-cafe",
      primaryColor: "#2B2B2B",
      secondaryColor: "#7CCBA2",
      backgroundColor: "#FFFFFF",
      headingFont: "dm-sans",
      bodyFont: "dm-sans",
      buttonStyle: "rounded",
      cardStyle: "outlined",
      radius: 14,
      background: "solid",
      categoryNav: "pills",
      itemLayout: "grid",
      headerStyle: "minimal",
      theme: "light",
      showImages: true,
    },
  },
  {
    id: "bold-street-food",
    name: "Bold Street Food",
    description: "High-energy dark canvas, chunky display type and punchy colour.",
    cover: "/images/covers/bold-street-food.jpg",
    sampleDish: "/images/dishes/smash-burger.jpg",
    branding: {
      template: "bold-street-food",
      primaryColor: "#FFC93C",
      secondaryColor: "#FF5A36",
      backgroundColor: "#151312",
      headingFont: "archivo-black",
      bodyFont: "space-grotesk",
      buttonStyle: "square",
      cardStyle: "flat",
      radius: 6,
      background: "solid",
      categoryNav: "pills",
      itemLayout: "grid",
      headerStyle: "cover",
      theme: "dark",
      showImages: true,
    },
  },
  {
    id: "luxury-dining",
    name: "Luxury Dining",
    description: "Candle-lit darkness, champagne gold and refined display serif.",
    cover: "/images/covers/luxury-dining.jpg",
    sampleDish: "/images/dishes/steak.jpg",
    branding: {
      template: "luxury-dining",
      primaryColor: "#E8BA77",
      secondaryColor: "#9C7A4E",
      backgroundColor: "#0F0D0C",
      headingFont: "playfair",
      bodyFont: "inter",
      buttonStyle: "pill",
      cardStyle: "minimal",
      radius: 0,
      background: "gradient",
      categoryNav: "underline",
      itemLayout: "list",
      headerStyle: "centered",
      theme: "dark",
      showImages: false,
    },
  },
  {
    id: "coastal-fresh",
    name: "Coastal Fresh",
    description: "Sea-glass blues, crisp whites and a breezy image-led grid.",
    cover: "/images/covers/coastal-fresh.jpg",
    sampleDish: "/images/dishes/poke-bowl.jpg",
    branding: {
      template: "coastal-fresh",
      primaryColor: "#1F6F8B",
      secondaryColor: "#7FCFC1",
      backgroundColor: "#F4FAFA",
      headingFont: "dm-serif",
      bodyFont: "dm-sans",
      buttonStyle: "rounded",
      cardStyle: "elevated",
      radius: 20,
      background: "gradient",
      categoryNav: "pills",
      itemLayout: "grid",
      headerStyle: "cover",
      theme: "light",
      showImages: true,
    },
  },
];

export function getTemplate(id: TemplateId) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
