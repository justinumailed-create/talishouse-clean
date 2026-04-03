export interface Bundle {
  id: string;
  name: string;
  units: number;
  basePrice: number;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  applicableProduct: string;
}

export interface ProductModel {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  options?: Record<string, string[]>;
  addons?: string[];
  bundles?: Bundle[];
}

export interface ProductFamily {
  id: string;
  name: string;
  slug: string;
  image: string;
  gridDescription: string;
  models: string[];
}

export interface CategoryModel {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export const PRODUCT_CATEGORIES: Record<string, CategoryModel[]> = {
  glasshouse: [
    { id: "160", name: "Glasshouse™ 160", price: 19995 },
    { id: "200", name: "Glasshouse™ 200", price: 24995 }
  ],
  recreational: [
    { id: "talishouse-400", name: "Talishouse™ 400", price: 39950, image: "/images/talishouse/recreational/400.png" },
    { id: "talishouse-800", name: "Talishouse™ 800", price: 79995, image: "/images/talishouse/recreational/800.png" }
  ],
  residential: [
    { id: "1600", name: "Talishouse™ 1600", price: 109995 },
    { id: "2400", name: "Talishouse™ 2400", price: 139995 }
  ]
};

export function getModelsByCategory(category: string): CategoryModel[] {
  return PRODUCT_CATEGORIES[category] || [];
}

export function getDefaultModel(category: string): CategoryModel | undefined {
  const models = PRODUCT_CATEGORIES[category];
  if (!models || models.length === 0) return undefined;
  return models[0];
}

export { ADDONS as addons, getAddonsForProduct, getAddonById, addonsRecord } from "@/lib/config/addons";

import { PRODUCT_IMAGE_MAP } from "@/lib/productImages";

const IMAGES = {
  'glasshouse': '/images/glasshouse/hero.png',
  'glasshouse-200': '/images/glasshouse/models/200.png',
  'talishouse-400': '/images/talishouse/recreational/hero.jpg',
  'talishouse-residential': '/images/talishouse/residential/hero.png',
  'talistowns': '/images/talistowns.jpg',
};

export const glasshouseFamily: ProductFamily = {
  id: "glasshouse",
  name: "Glasshouse™",
  slug: "glasshouse",
  image: IMAGES['glasshouse'],
  gridDescription: `Glasshouse™ : The quick start option:
- Up to five units shipped together with up to five optional deck platforms in one sea-can container.
- Size and appearance: 10 x 20 ft. each, one, two or three sides glass.
- Most commonly arranged L-shaped, U-shaped or parallel.
- Most suitable as "VIEW" cottages, for own use, or in short term rental applications.
- Retail, Wholesale and Lease-To-Own purchasing terms.`,
  models: ["glasshouse-200"],
};

export const glasshouseModels: ProductModel[] = [
  {
    id: "glasshouse-200",
    name: "Glasshouse™ 200",
    category: "glasshouse",
    price: 19950,
    image: IMAGES['glasshouse-200'],
    description: `Description:
8' x 20' or 10' x 20' steel structures featuring one, two or three sides glass.
Great as short-term rental cottages with a view or home offices.`,
    options: {
      "Roofing, Gutter & Windows Colour": [
        "Dark / Dark / Dark",
        "Bright / White / White",
      ],
      "Kitchen Style": ["KC01", "KC02", "KC03", "KC04", "KC05", "KC06"],
      "Bath Style": ["TL01", "TL02", "TL03", "TL04", "TL05", "TL06"],
      "Flooring Colour": ["Light Oak", "Dark Walnut"],
      "Siding Options": ["Color Code Options", "Monochrome / Single Color"],
    },
    addons: ["glasshouse-deck", "glasshouse-glass-upgrade", "glasshouse-climate"],
  },
];

export const talishouseFamily: ProductFamily = {
  id: "talishouse",
  name: "Talishouse™",
  slug: "talishouse",
  image: IMAGES['talishouse-400'],
  gridDescription: `Talishouse™ : The flexible modular home system:
- 21' x 20' steel structures assembled in one day and move-in ready in one week.
- Two bedrooms, one bath, open concept living-dining-kitchen.
- Scalable from single units to multi-unit developments.
- Retail, Wholesale and Lease-To-Own purchasing terms.`,
  models: ["talishouse-400", "talishouse-residential"],
};

export const talishouseModels: ProductModel[] = [
  {
    id: "talishouse-400",
    name: "Talishouse™ 400",
    category: "talishouse-400",
    price: 39950,
    image: IMAGES['talishouse-400'],
    description: `Description:
21' x 20' steel structures assembled in one day and move-in ready in one week.
Two bedrooms, one bath, open concept living-dining-kitchen.`,
    options: {
      "Roofing, Gutter & Windows Colour": [
        "Dark / Dark / Dark",
        "Bright / White / White",
      ],
      "Kitchen Style": ["KC01", "KC02", "KC03", "KC04", "KC05", "KC06"],
      "Bath Style": ["TL01", "TL02", "TL03", "TL04", "TL05", "TL06"],
      "Flooring Colour": ["Light Oak", "Dark Walnut"],
      "Siding Options": ["Color Code Options", "Monochrome / Single Color"],
    },
    addons: ["talishouse-400-pergola", "talishouse-400-roofing", "talishouse-400-interior"],
  },
  {
    id: "talishouse-residential",
    name: "Talishouse™ Residential",
    category: "talishouse-residential",
    price: 39975,
    image: IMAGES['talishouse-residential'],
    description: `Description:
Expanded residential living solution with additional square footage.
Two bedrooms, one bath, open concept living-dining-kitchen with extra space.`,
    options: {
      "Roofing, Gutter & Windows Colour": [
        "Dark / Dark / Dark",
        "Bright / White / White",
      ],
      "Kitchen Style": ["KC01", "KC02", "KC03", "KC04", "KC05", "KC06"],
      "Bath Style": ["TL01", "TL02", "TL03", "TL04", "TL05", "TL06"],
      "Flooring Colour": ["Light Oak", "Dark Walnut"],
      "Siding Options": ["Color Code Options", "Monochrome / Single Color"],
    },
    addons: ["talishouse-residential-platform", "talishouse-residential-pergola", "talishouse-residential-install"],
    bundles: [
      { id: "residential-800", name: "Talishouse™ 800", units: 1, basePrice: 39975 },
      { id: "residential-1600", name: "Talishouse™ 1600", units: 2, basePrice: 39975 },
      { id: "residential-2400", name: "Talishouse™ 2400", units: 3, basePrice: 39975 },
    ],
  },
];

export const talistownsFamily: ProductFamily = {
  id: "talistowns",
  name: "TalisTowns™",
  slug: "talistowns",
  image: IMAGES['talistowns'],
  gridDescription: `TalisTowns™ : Moonlighting made easy:
- Seen here: 20 units in 10 structures, high rise gable roofs added locally.
- Units are 21x20 in size, two bedrooms, one bath, open concept living - dining - kitchen.

Intended for:
- Residential use: $1,000 per month at 100% occupancy = $240,000 per year gross.
- Short term rental: $200 per night at 70% occupancy = $715,400 per year gross.

- Retail, Wholesale and Lease-To-Own purchasing terms.`,
  models: ["talistowns"],
};

export const talistownsModels: ProductModel[] = [
  {
    id: "talistowns",
    name: "TalisTowns™",
    category: "talistowns",
    price: 39950,
    image: IMAGES['talistowns'],
    description: `Description:
TalisTowns™ community development system using multiple Talishouse™ 400 units.
Scalable from single structures to complete communities.`,
    addons: ["talistowns-bulk", "talistowns-infrastructure", "talistowns-planning"],
  },
];
