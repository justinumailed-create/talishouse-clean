/**
 * Talishouse™ catalogue spec sheets (Ralf, Oct 17 2026): T-House, updated
 * T-Dome (replaces the old dome page) and G-House.
 *
 * Ralf's sheets are images with bare "$" prices. The photo half is used as an
 * image (public/talisu/catalogue/spec-*.webp, cropped from his sheets) and the
 * spec panel is rendered as HTML so prices read "From CAD … / sq.ft."
 * (Canada pricing: CAD only).
 */

export type CatalogueSpecLocale = "en" | "de";

export type CatalogueSpec = {
  id: "t-house" | "t-dome" | "g-house";
  name: string;
  photo: string;
  /** Floor area exactly as on Ralf's sheet. */
  size: string;
  /** "includes" vs. "may include" (T-Dome). */
  includesKind: "includes" | "mayInclude";
  rooms: Record<CatalogueSpecLocale, readonly string[]>;
  notes: Record<CatalogueSpecLocale, readonly string[]>;
  /** Starting price per sq.ft. in CAD (whole dollars). */
  fromCadPerSqft: number;
};

export const CATALOGUE_SPEC_SERVICES: Record<CatalogueSpecLocale, readonly string[]> = {
  en: [
    "Prepare Driveway",
    "Prepare Building Site",
    "Build Platform / Foundation",
    "Unit Transport & Assembly",
    "Finish Main Room, Kitchen & Bath",
    "Prepare Water & Disposal Systems",
    "Install Solar & Storage System",
    "Install Heating & Cooling",
  ],
  de: [
    "Zufahrt vorbereiten",
    "Baugrundstück vorbereiten",
    "Plattform / Fundament bauen",
    "Transport & Montage der Einheit",
    "Hauptraum, Küche & Bad ausbauen",
    "Wasser- & Entsorgungssysteme vorbereiten",
    "Solar- & Speichersystem installieren",
    "Heizung & Kühlung installieren",
  ],
};

export const CATALOGUE_SPECS: readonly CatalogueSpec[] = [
  {
    id: "t-house",
    name: "T-House",
    photo: "/talisu/catalogue/spec-thouse.webp",
    size: "400 or 800 sq.ft.",
    includesKind: "includes",
    rooms: {
      en: ["Open Concept", "LR - DR - KT", "2x BR - 1x Bath"],
      de: ["Offenes Konzept", "WZ - EZ - KÜ", "2x SZ - 1x Bad"],
    },
    notes: {
      en: [
        "Finished inside, but not furnished.",
        "Mobile platform not included: may negate the need for Building Permits in many jurisdictions.",
      ],
      de: [
        "Innen ausgebaut, aber nicht möbliert.",
        "Mobile Plattform nicht enthalten: kann in vielen Gemeinden eine Baugenehmigung entbehrlich machen.",
      ],
    },
    fromCadPerSqft: 150,
  },
  {
    id: "t-dome",
    name: "T-Dome",
    photo: "/talisu/catalogue/spec-tdome.webp",
    size: "305 sq.ft.",
    includesKind: "mayInclude",
    rooms: {
      en: ["Living Room", "Efficiency Kitchen", "Luxury Bath"],
      de: ["Wohnzimmer", "Kompaktküche", "Luxusbad"],
    },
    notes: {
      en: ["finished inside, but not furnished", "Platform not included", "Not exactly as shown"],
      de: ["innen ausgebaut, aber nicht möbliert", "Plattform nicht enthalten", "Nicht exakt wie abgebildet"],
    },
    fromCadPerSqft: 150,
  },
  {
    id: "g-house",
    name: "G-House",
    photo: "/talisu/catalogue/spec-ghouse.webp",
    size: "160 or 200 sq.ft.",
    includesKind: "includes",
    rooms: {
      en: ["Living Room", "Kitchen", "Bath"],
      de: ["Wohnzimmer", "Küche", "Bad"],
    },
    notes: {
      en: [
        "One, two or three sides glass.",
        "Finished inside, but not furnished.",
        "Platform not included.",
      ],
      de: [
        "Eine, zwei oder drei Seiten Glas.",
        "Innen ausgebaut, aber nicht möbliert.",
        "Plattform nicht enthalten.",
      ],
    },
    fromCadPerSqft: 100,
  },
];

export function catalogueSpecById(id: string | null | undefined): CatalogueSpec | null {
  return CATALOGUE_SPECS.find((spec) => spec.id === id) ?? null;
}

/** "From CAD 150 / sq.ft." (never a bare $). */
export function catalogueSpecPrice(
  spec: Pick<CatalogueSpec, "fromCadPerSqft">,
  labels: { from: string; perSqft: string },
): string {
  return `${labels.from} CAD ${spec.fromCadPerSqft.toLocaleString("en-CA")} ${labels.perSqft}`;
}

/** German sizes use "oder"; the figure and unit stay as on the sheet. */
export function catalogueSpecSize(spec: Pick<CatalogueSpec, "size">, locale: CatalogueSpecLocale): string {
  return locale === "de" ? spec.size.replace(" or ", " oder ") : spec.size;
}
