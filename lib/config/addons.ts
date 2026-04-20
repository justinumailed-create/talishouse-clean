export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  sizes?: { size: string; price: number }[];
  compatibleWith: string[];
  volume?: number;
}

export const ADDONS: Addon[] = [
  {
    id: "gable_roof",
    name: "Gable Roof",
    price: 14950,
    description: "Recommended for all Talishouse™ models (TH) placed on permanent foundations: screw piles, piers and slabs. The price reflects price per unit (TH 800 = 1; TH 1,600 = 2; TH 2,400 = 3; TH 3200 = 4).",
    compatibleWith: ["glasshouse-200", "talishouse-400", "talishouse-800"],
  },
  {
    id: "roof_top_patio",
    name: "Roof Top Patio",
    price: 14950,
    description: "Roof Top Patio's are available for Talishouse™ 400 modules, permanent placement only (stairs must be anchored to ensure long term safety).",
    compatibleWith: ["glasshouse-200", "talishouse-400", "talishouse-800"],
  },
  {
    id: "deck_veranda",
    name: "Deck or Veranda",
    price: 9950,
    description: "Decks and Verandas are 8' x 20' or 10' x 20' in size, depending upon the product they complement. Typically they require their own foundations.",
    compatibleWith: ["glasshouse-200", "talishouse-400", "talishouse-800"],
  },
  {
    id: "talishouse-residential-platform",
    name: "Permanent Platform",
    description: "Heavy-duty permanent platform for Talishouse™ Residential units.",
    price: 24995,
    compatibleWith: ["talishouse-residential"],
  },
  {
    id: "talishouse-residential-pergola",
    name: "Pergola / Veranda",
    description: "Stylish covered outdoor area perfect for relaxation and entertaining.",
    price: 14450,
    compatibleWith: ["talishouse-residential"],
  },
  {
    id: "talishouse-residential-install",
    name: "Multi-Unit Installation Support",
    description: "Professional installation support for multi-unit configurations.",
    price: 25000,
    compatibleWith: ["talishouse-residential"],
  },
  {
    id: "talistowns-bulk",
    name: "Bulk Deployment Package",
    description: "Volume pricing package for multi-unit TalisTowns™ deployments.",
    price: 45000,
    compatibleWith: ["talistowns"],
  },
  {
    id: "talistowns-infrastructure",
    name: "Infrastructure Setup",
    description: "Complete infrastructure planning and setup for community developments.",
    price: 75000,
    compatibleWith: ["talistowns"],
  },
  {
    id: "talistowns-planning",
    name: "Community Layout Planning",
    description: "Professional layout planning services for optimal community design.",
    price: 15000,
    compatibleWith: ["talistowns"],
  },
  {
    id: "mobile_platform_20",
    name: "20 ft. Mobile Platform",
    price: 14950,
    description: "The 20 ft. mobile platform is matched to the Talishouse™ 400 product to maintain its ability to be placed anywhere without necessarily requiring Building Permits.",
    compatibleWith: ["talishouse-400"],
  },
  {
    id: "mobile_platform_40",
    name: "40 ft. Mobile Platform",
    price: 19950,
    description: "The 40 ft. mobile platform is matched to the Talishouse™ 800 product to maintain its ability to be placed anywhere without necessarily requiring Building Permits.",
    compatibleWith: ["talishouse-800"],
  },
];

export const getAddonsForProduct = (productId: string): Addon[] => {
  return ADDONS.filter((addon) => addon.compatibleWith.includes(productId));
};

export const getAddonById = (addonId: string): Addon | undefined => {
  return ADDONS.find((addon) => addon.id === addonId);
};

export const addonsRecord: Record<string, Addon> = ADDONS.reduce(
  (acc, addon) => {
    acc[addon.id] = addon;
    return acc;
  },
  {} as Record<string, Addon>
);
