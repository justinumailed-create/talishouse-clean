/**
 * Where a Build Demo was placed: country + province / state, parsed from the
 * Google formatted address (pure — safe for tests and the client).
 */

export type DemoRegion = {
  country: "Canada" | "USA" | null;
  /** Province / territory / state name, e.g. "Ontario". */
  region: string | null;
  /** Two-letter code, e.g. "ON". */
  regionCode: string | null;
};

export const CANADA_PROVINCES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

function norm(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function byName(table: Record<string, string>, text: string): [string, string] | null {
  const t = norm(text);
  for (const [code, name] of Object.entries(table)) {
    if (t === norm(name)) return [code, name];
  }
  if (t === "quebec" || t === "québec") return ["QC", "Quebec"];
  if (t === "newfoundland" || t === "labrador") return ["NL", "Newfoundland and Labrador"];
  return null;
}

/**
 * Parse "123 Main St, Toronto, ON M5V 2T6, Canada" (or "…, NY 10001, USA").
 * Country comes from the last segment when present, else from the region code.
 */
export function parseDemoRegion(address: string | null | undefined): DemoRegion {
  const parts = (address || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { country: null, region: null, regionCode: null };

  const last = norm(parts[parts.length - 1] ?? "");
  let country: DemoRegion["country"] = null;
  if (last === "canada") country = "Canada";
  else if (last === "usa" || last === "united states" || last === "united states of america" || last === "us") {
    country = "USA";
  }

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const segment = parts[i] ?? "";
    // "ON M5V 2T6" / "NY 10001" / "Ontario"
    const tokens = segment.split(/\s+/);
    const code = (tokens[0] || "").toUpperCase();
    if (/^[A-Z]{2}$/.test(code)) {
      if (country !== "USA" && CANADA_PROVINCES[code]) {
        return { country: "Canada", region: CANADA_PROVINCES[code]!, regionCode: code };
      }
      if (country !== "Canada" && US_STATES[code]) {
        return { country: "USA", region: US_STATES[code]!, regionCode: code };
      }
    }
    const withoutPostal = segment.replace(/\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, "").replace(/\s+\d{5}(-\d{4})?$/, "");
    const ca = country !== "USA" ? byName(CANADA_PROVINCES, withoutPostal) : null;
    if (ca) return { country: "Canada", region: ca[1], regionCode: ca[0] };
    const us = country !== "Canada" ? byName(US_STATES, withoutPostal) : null;
    if (us) return { country: "USA", region: us[1], regionCode: us[0] };
  }
  return { country, region: null, regionCode: null };
}

/** Rough country from coordinates when the address has none (lower 48 vs Canada). */
export function countryFromCoordinates(latitude: number, longitude: number): DemoRegion["country"] {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (longitude > -50 || longitude < -170) return null;
  if (latitude >= 49.0) return "Canada";
  if (latitude < 41.6) return "USA";
  return null; // Great Lakes / Maritimes border band: unknown without geocoding
}

/** Follow-up owner per Ralf: Aritri for Canada, Enanko for the USA. */
export function demoFollowUpAgent(country: DemoRegion["country"]): "Aritri" | "Enanko" | null {
  if (country === "Canada") return "Aritri";
  if (country === "USA") return "Enanko";
  return null;
}
