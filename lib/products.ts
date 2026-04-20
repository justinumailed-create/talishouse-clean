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
  'talishouse-residential': '/images/talishouse/residential/hero.jpg',
  'talistowns': '/images/talistowns.jpg',
};

export const glasshouseFamily: ProductFamily = {
  id: "glasshouse",
  name: "Glasshouse™",
  slug: "glasshouse",
  image: IMAGES['glasshouse'],
  gridDescription: `160 sq.ft & 200 sq.ft., one, two or three sides glass.  
Open concept, three season rated.  
Permanent installation only, deck or pergola optional.  
Up in a day, finished in a week.  
Characterization: it is finished open space. Dividing walls, amenities and furniture are added to taste after completion.`,
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
    addons: ["gable_roof", "roof_top_patio", "deck_veranda"],
  },
];

export const talishouseFamily: ProductFamily = {
  id: "talishouse",
  name: "Talishouse™",
  slug: "talishouse",
  image: IMAGES['talishouse-400'],
  gridDescription: `400 - 800 sq.ft.. Permanent or mobile installation (on wheeled platforms. Mobile installation may negate the need for Building Permits in many Canadian jurisdictions).  
Up in a day, finished in a week.  
Characterization: it includes an efficiency kitchen and four-piece bath, however, the number of bedrooms is size dependent.  
Open concept kitchen - living - dining areas.  
Furniture is added to taste after completion.`,
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
    addons: ["gable_roof", "roof_top_patio", "deck_veranda", "mobile_platform_20"],
  },
  {
    id: "talishouse-800",
    name: "Talishouse™ 800",
    category: "talishouse-800",
    price: 79995,
    image: IMAGES['talishouse-400'],
    description: `Description:
Double module steel structures assembled in one day.
Four bedrooms, two baths, expanded living areas.`,
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
    addons: ["gable_roof", "roof_top_patio", "deck_veranda", "mobile_platform_40"],
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
  name: "Talistowns™",
  slug: "talistowns",
  image: IMAGES['talistowns'],
  gridDescription: `Talistowns™ consist of Talishouse™ 400 modules, two units under one roof. Permanent or mobile installation. Gable roofs are an extra charge option.
- A 12 months short-term rental season at $200 per night and 70% occupancy generates $51,100 in revenue per unit per year.
- A 12 months long-term rental season at $2,000 per month and 100% occupancy generates $24,000 in revenue per unit per year.
Conclusion: Talistowns™ are a great way to "moonlight" towards lifestyle goals and financial independence…!`,
  models: ["talistowns"],
};

export const talistownsModels: ProductModel[] = [
  {
    id: "talistowns",
    name: "Talistowns™",
    category: "talistowns",
    price: 0,
    image: "/images/talistowns.jpg",
    description: `Talistowns™ consist of Talishouse™ 400 modules, two units under one roof. Permanent or mobile installation. Gable roofs are an extra charge option.
- A 12 months short-term rental season at $200 per night and 70% occupancy generates $51,100 in revenue per unit per year.
- A 12 months long-term rental season at $2,000 per month and 100% occupancy generates $24,000 in revenue per unit per year.
Conclusion: Talistowns™ are a great way to "moonlight" towards lifestyle goals and financial independence…!`,
    addons: ["talistowns-bulk", "talistowns-infrastructure", "talistowns-planning"],
  },
];
