export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  compatibleWith: string[];
}

export const ADDONS: Addon[] = [
  {
    id: "glasshouse-deck",
    name: "Deck Platform (10ft / 20ft)",
    description: "Custom deck platform for Glasshouse™ 200 units.",
    price: 9450,
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "glasshouse-glass-upgrade",
    name: "Glass Upgrade Options",
    description: "Enhanced glass options for better insulation and views.",
    price: 4500,
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "glasshouse-climate",
    name: "Smart Climate Kit",
    description: "Smart climate control system for optimal temperature management.",
    price: 3500,
    compatibleWith: ["glasshouse-200"],
  },
  {
    id: "talishouse-400-pergola",
    name: "Pergola / Veranda",
    description: "Stylish covered outdoor area perfect for relaxation and entertaining.",
    price: 14450,
    compatibleWith: ["talishouse-400"],
  },
  {
    id: "talishouse-400-roofing",
    name: "Roofing Upgrade",
    description: "Premium roofing options for enhanced aesthetics and durability.",
    price: 8950,
    compatibleWith: ["talishouse-400"],
  },
  {
    id: "talishouse-residential-platform",
    name: "Permanent 40ft Platform",
    description: "Heavy-duty permanent platform for Talishouse™ Residential units.",
    price: 14950,
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
