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
    id: "glasshouse-deck-8x20",
    name: "Deck Platform",
    description: "8' x 20' deck platform for Glasshouse™ units.",
    price: 9995,
    sizes: [
      { size: "8x20", price: 9995 },
      { size: "10x20", price: 11995 },
    ],
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "glasshouse-mobile-platform-8x20",
    name: "Mobile Platform",
    description: "8' x 20' mobile platform for Glasshouse™ units.",
    price: 19995,
    sizes: [
      { size: "8x20", price: 19995 },
      { size: "10x20", price: 24995 },
    ],
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "glasshouse-pergola-8x20",
    name: "Pergola",
    description: "8' x 20' pergola for outdoor coverage.",
    price: 14995,
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "talishouse-400-pergola",
    name: "Pergola / Veranda",
    description: "Stylish covered outdoor area perfect for relaxation and entertaining.",
    price: 14450,
    compatibleWith: ["talishouse-400", "talishouse-800"],
  },
  {
    id: "talishouse-400-roofing",
    name: "Roofing Upgrade",
    description: "Premium roofing options for enhanced aesthetics and durability.",
    price: 8950,
    compatibleWith: ["talishouse-400", "talishouse-800"],
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
