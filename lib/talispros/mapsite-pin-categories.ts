/**
 * Mapsite PIN categories (Ralf, Oct 17 2026).
 *
 * Every PIN (main + additional) may carry a category. The left card's
 * "Select Category" filter hides PINs outside the chosen category. Five
 * categories are mandatory and stored by id; a Root account holder may add up
 * to five custom categories, stored on PINs as "custom:<label>". Derivative
 * Mapsites use their Root's custom categories.
 */

export type MapSiteLocale = "en" | "de";

export const MANDATORY_PIN_CATEGORIES = [
  {
    id: "residential",
    label: { en: "Residential", de: "Wohnimmobilien" },
    description: {
      en: "For detached, standalone houses.",
      de: "Für freistehende Einzelhäuser.",
    },
  },
  {
    id: "vacant-land",
    label: { en: "Vacant Land", de: "Bauland" },
    description: {
      en: "For undeveloped lots, acreage, or plots ready for building.",
      de: "Für unbebaute Grundstücke, Landflächen oder baureife Parzellen.",
    },
  },
  {
    id: "investment",
    label: { en: "Investment", de: "Kapitalanlage" },
    description: {
      en: "For multi-family units, fixer-uppers, or properties expected to increase in value through subdivision.",
      de: "Für Mehrfamilienhäuser, Sanierungsobjekte oder Immobilien, deren Wert durch Teilung steigen soll.",
    },
  },
  {
    id: "commercial",
    label: { en: "Commercial", de: "Gewerbe" },
    description: {
      en: "For offices, retail storefronts, warehouses, and industrial spaces.",
      de: "Für Büros, Ladenlokale, Lagerhallen und Industrieflächen.",
    },
  },
  {
    id: "luxury",
    label: { en: "Luxury", de: "Luxus" },
    description: {
      en: "For high-end properties featuring premium price tags and elite amenities.",
      de: "Für hochwertige Immobilien mit Premium-Preisen und exklusiver Ausstattung.",
    },
  },
] as const;

export type MandatoryPinCategoryId = (typeof MANDATORY_PIN_CATEGORIES)[number]["id"];

export const MAX_CUSTOM_PIN_CATEGORIES = 5;
export const PIN_CATEGORY_LABEL_MAX = 40;
export const CUSTOM_PIN_CATEGORY_PREFIX = "custom:";

export type PinCategoryOption = {
  value: string;
  label: string;
  description: string | null;
  custom: boolean;
};

const MANDATORY_IDS = new Set<string>(MANDATORY_PIN_CATEGORIES.map((c) => c.id));

/** Trim, collapse spaces, drop empties/duplicates (case-insensitive), cap at five. */
export function normalizeCustomPinCategories(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const label = raw.replace(/\s+/g, " ").trim().slice(0, PIN_CATEGORY_LABEL_MAX);
    if (!label) continue;
    const key = label.toLowerCase();
    const clashesMandatory = MANDATORY_PIN_CATEGORIES.some(
      (c) => c.label.en.toLowerCase() === key || c.id === key,
    );
    if (clashesMandatory || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= MAX_CUSTOM_PIN_CATEGORIES) break;
  }
  return out;
}

export function customPinCategoryValue(label: string): string {
  return `${CUSTOM_PIN_CATEGORY_PREFIX}${label}`;
}

/** Select options: the five mandatory categories, then the Root's custom ones. */
export function pinCategoryOptions(
  customCategories: ReadonlyArray<string>,
  locale: MapSiteLocale = "en",
): PinCategoryOption[] {
  return [
    ...MANDATORY_PIN_CATEGORIES.map((c) => ({
      value: c.id,
      label: c.label[locale],
      description: c.description[locale],
      custom: false,
    })),
    ...normalizeCustomPinCategories(customCategories).map((label) => ({
      value: customPinCategoryValue(label),
      label,
      description: null,
      custom: true,
    })),
  ];
}

/**
 * Validates a category value from a client. Returns null for "no category",
 * the value when allowed, or undefined when it is not one of the options.
 */
export function parsePinCategory(
  value: unknown,
  customCategories: ReadonlyArray<string>,
): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (MANDATORY_IDS.has(trimmed)) return trimmed;
  if (trimmed.startsWith(CUSTOM_PIN_CATEGORY_PREFIX)) {
    const label = trimmed.slice(CUSTOM_PIN_CATEGORY_PREFIX.length);
    const match = normalizeCustomPinCategories(customCategories).find(
      (c) => c.toLowerCase() === label.trim().toLowerCase(),
    );
    return match ? customPinCategoryValue(match) : undefined;
  }
  return undefined;
}

export function pinCategoryLabel(
  value: string | null | undefined,
  locale: MapSiteLocale = "en",
): string | null {
  if (!value) return null;
  const mandatory = MANDATORY_PIN_CATEGORIES.find((c) => c.id === value);
  if (mandatory) return mandatory.label[locale];
  if (value.startsWith(CUSTOM_PIN_CATEGORY_PREFIX)) {
    return value.slice(CUSTOM_PIN_CATEGORY_PREFIX.length) || null;
  }
  return null;
}

/** "" (or null) = every PIN; otherwise only PINs whose category matches. */
export function filterPinsByCategory<T extends { category?: string | null }>(
  pins: ReadonlyArray<T>,
  category: string | null | undefined,
): T[] {
  if (!category) return [...pins];
  return pins.filter((pin) => pin.category === category);
}
