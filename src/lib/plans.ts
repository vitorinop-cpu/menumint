import type { PlanId, TemplateId } from "./domain";

export type BrandingLevel = "basic" | "standard" | "full";
export type QrLevel = "basic" | "color" | "full";
export type AnalyticsLevel = "none" | "basic" | "detailed";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Proposed monthly price in USD. Configure the real price in Stripe. */
  priceMonthly: number;
  tagline: string;
  highlight?: boolean;
  limits: {
    restaurants: number;
    menus: number;
    members: number;
    analyticsDays: number;
  };
  templates: TemplateId[];
  branding: BrandingLevel;
  qr: QrLevel;
  analytics: AnalyticsLevel;
  removeBadge: boolean;
  features: string[];
}

const ALL_TEMPLATES: TemplateId[] = [
  "modern-bistro",
  "classic-elegance",
  "minimal-cafe",
  "bold-street-food",
  "luxury-dining",
  "coastal-fresh",
];

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "Get your first menu online today.",
    limits: { restaurants: 1, menus: 1, members: 1, analyticsDays: 0 },
    templates: ["modern-bistro", "minimal-cafe"],
    branding: "basic",
    qr: "basic",
    analytics: "none",
    removeBadge: false,
    features: ["One restaurant", "One menu", "Classic QR code", "2 templates, colours & logo"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 9,
    tagline: "For cafés growing their menu.",
    limits: { restaurants: 1, menus: 5, members: 1, analyticsDays: 30 },
    templates: ["modern-bistro", "minimal-cafe", "classic-elegance", "coastal-fresh"],
    branding: "standard",
    qr: "color",
    analytics: "basic",
    removeBadge: false,
    features: ["Up to 5 menus", "4 templates + typography", "Coloured QR codes", "30-day basic analytics"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    tagline: "The full studio for your brand.",
    highlight: true,
    limits: { restaurants: 1, menus: 50, members: 1, analyticsDays: 365 },
    templates: ALL_TEMPLATES,
    branding: "full",
    qr: "full",
    analytics: "detailed",
    removeBadge: true,
    features: [
      "Unlimited menus",
      "All 6 premium templates",
      "QR styles, logos & frames",
      "Detailed analytics & popular items",
      "Full branding controls",
      "No MenuMint badge",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 39,
    tagline: "Groups, locations and teams.",
    limits: { restaurants: 10, menus: 50, members: 15, analyticsDays: 365 },
    templates: ALL_TEMPLATES,
    branding: "full",
    qr: "full",
    analytics: "detailed",
    removeBadge: true,
    features: ["Everything in Pro", "Up to 10 locations", "Team members & roles", "Centralised management"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

export function planRank(plan: PlanId) {
  return PLAN_ORDER.indexOf(plan);
}

export function minimumPlanForTemplate(template: TemplateId): PlanId {
  return PLAN_ORDER.find((p) => PLANS[p].templates.includes(template)) ?? "pro";
}

/** Fields of the branding config unlocked at each level. */
export const BRANDING_FIELDS: Record<BrandingLevel, string[]> = {
  basic: ["template", "primaryColor", "secondaryColor", "backgroundColor", "theme", "showImages"],
  standard: [
    "template",
    "primaryColor",
    "secondaryColor",
    "backgroundColor",
    "theme",
    "showImages",
    "headingFont",
    "bodyFont",
    "categoryNav",
    "itemLayout",
  ],
  full: [
    "template",
    "primaryColor",
    "secondaryColor",
    "backgroundColor",
    "theme",
    "showImages",
    "headingFont",
    "bodyFont",
    "categoryNav",
    "itemLayout",
    "buttonStyle",
    "cardStyle",
    "radius",
    "background",
    "headerStyle",
  ],
};
