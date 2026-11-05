/**
 * Ralf's sourcing parameters (Nov 5) and the anchor-town seed list.
 *
 * - Independent, non-franchise brokerages only (see FRANCHISE_PATTERNS).
 * - A market is ~80 km across around an anchor town of 10k–50k people
 *   (aiming at ~100k people in the whole market; not verified per market).
 * - Canada only, worked east → west, then south → north inside each band.
 * - No Nova Scotia for now.
 * - 3 ranked brokerages per market; pins at the brokerage office only.
 *
 * Populations: Statistics Canada, 2021 Census of Population, municipal
 * (census subdivision) counts, rounded to the nearest 100.
 * lat/lng are approximate town centres used only for ordering; the search
 * itself geocodes the town through Google.
 */

export interface AnchorTown {
  town: string;
  province: "NL" | "PE" | "NB" | "QC" | "ON" | "MB" | "SK" | "AB" | "BC";
  population2021: number;
  lat: number;
  lng: number;
}

export const MARKET_DIAMETER_KM = 80;
export const BROKERAGES_PER_MARKET = 3;
export const EXCLUDED_PROVINCES = ["NS"] as const;

const SEED: AnchorTown[] = [
  { town: "Gander", province: "NL", population2021: 11900, lat: 48.95, lng: -54.61 },
  { town: "Grand Falls-Windsor", province: "NL", population2021: 14200, lat: 48.94, lng: -55.66 },
  { town: "Corner Brook", province: "NL", population2021: 19300, lat: 48.95, lng: -57.95 },
  { town: "Summerside", province: "PE", population2021: 16000, lat: 46.4, lng: -63.79 },
  { town: "Miramichi", province: "NB", population2021: 17700, lat: 47.03, lng: -65.5 },
  { town: "Bathurst", province: "NB", population2021: 12200, lat: 47.62, lng: -65.65 },
  { town: "Edmundston", province: "NB", population2021: 16400, lat: 47.37, lng: -68.33 },
  { town: "Matane", province: "QC", population2021: 14100, lat: 48.85, lng: -67.53 },
  { town: "Sept-Îles", province: "QC", population2021: 24600, lat: 50.22, lng: -66.38 },
  { town: "Rimouski", province: "QC", population2021: 48900, lat: 48.45, lng: -68.52 },
  { town: "Baie-Comeau", province: "QC", population2021: 20700, lat: 49.22, lng: -68.15 },
  { town: "Rivière-du-Loup", province: "QC", population2021: 20100, lat: 47.83, lng: -69.53 },
  { town: "Magog", province: "QC", population2021: 28300, lat: 45.27, lng: -72.15 },
  { town: "Thetford Mines", province: "QC", population2021: 25400, lat: 46.1, lng: -71.3 },
  { town: "Victoriaville", province: "QC", population2021: 47800, lat: 46.06, lng: -71.96 },
  { town: "Sorel-Tracy", province: "QC", population2021: 35200, lat: 46.04, lng: -73.11 },
  { town: "Joliette", province: "QC", population2021: 20800, lat: 46.02, lng: -73.44 },
  { town: "Alma", province: "QC", population2021: 30300, lat: 48.55, lng: -71.65 },
  { town: "Cornwall", province: "ON", population2021: 47800, lat: 45.02, lng: -74.73 },
  { town: "Brockville", province: "ON", population2021: 21900, lat: 44.59, lng: -75.68 },
  { town: "Pembroke", province: "ON", population2021: 13900, lat: 45.83, lng: -77.11 },
  { town: "Val-d'Or", province: "QC", population2021: 32800, lat: 48.1, lng: -77.78 },
  { town: "Cobourg", province: "ON", population2021: 20500, lat: 43.96, lng: -78.17 },
  { town: "Rouyn-Noranda", province: "QC", population2021: 42300, lat: 48.24, lng: -79.02 },
  { town: "Huntsville", province: "ON", population2021: 21100, lat: 45.33, lng: -79.22 },
  { town: "Orillia", province: "ON", population2021: 33400, lat: 44.61, lng: -79.42 },
  { town: "Leamington", province: "ON", population2021: 29700, lat: 42.05, lng: -82.6 },
  { town: "Woodstock", province: "ON", population2021: 46700, lat: 43.13, lng: -80.76 },
  { town: "Stratford", province: "ON", population2021: 33200, lat: 43.37, lng: -80.98 },
  { town: "Collingwood", province: "ON", population2021: 24800, lat: 44.5, lng: -80.22 },
  { town: "Midland", province: "ON", population2021: 17800, lat: 44.75, lng: -79.89 },
  { town: "Owen Sound", province: "ON", population2021: 21600, lat: 44.57, lng: -80.94 },
  { town: "Timmins", province: "ON", population2021: 41100, lat: 48.48, lng: -81.33 },
  { town: "Kenora", province: "ON", population2021: 15000, lat: 49.77, lng: -94.49 },
  { town: "Steinbach", province: "MB", population2021: 17800, lat: 49.53, lng: -96.68 },
  { town: "Portage la Prairie", province: "MB", population2021: 13300, lat: 49.97, lng: -98.29 },
  { town: "Thompson", province: "MB", population2021: 13000, lat: 55.74, lng: -97.86 },
  { town: "Estevan", province: "SK", population2021: 10900, lat: 49.14, lng: -102.99 },
  { town: "Yorkton", province: "SK", population2021: 16300, lat: 51.21, lng: -102.46 },
  { town: "Moose Jaw", province: "SK", population2021: 33700, lat: 50.39, lng: -105.53 },
  { town: "Prince Albert", province: "SK", population2021: 37800, lat: 53.2, lng: -105.75 },
  { town: "Swift Current", province: "SK", population2021: 16800, lat: 50.29, lng: -107.79 },
  { town: "North Battleford", province: "SK", population2021: 13800, lat: 52.76, lng: -108.29 },
  { town: "Lloydminster", province: "AB", population2021: 19700, lat: 53.28, lng: -110.0 },
  { town: "Cold Lake", province: "AB", population2021: 15700, lat: 54.46, lng: -110.18 },
  { town: "Brooks", province: "AB", population2021: 14900, lat: 50.56, lng: -111.9 },
  { town: "Camrose", province: "AB", population2021: 18800, lat: 53.02, lng: -112.83 },
  { town: "Okotoks", province: "AB", population2021: 30400, lat: 50.73, lng: -113.98 },
  { town: "Lacombe", province: "AB", population2021: 13400, lat: 52.47, lng: -113.73 },
  { town: "Sylvan Lake", province: "AB", population2021: 16000, lat: 52.31, lng: -114.1 },
  { town: "Canmore", province: "AB", population2021: 16000, lat: 51.09, lng: -115.36 },
  { town: "Cranbrook", province: "BC", population2021: 20500, lat: 49.51, lng: -115.77 },
  { town: "Nelson", province: "BC", population2021: 11100, lat: 49.49, lng: -117.29 },
  { town: "Penticton", province: "BC", population2021: 36900, lat: 49.49, lng: -119.59 },
  { town: "Vernon", province: "BC", population2021: 44500, lat: 50.27, lng: -119.27 },
  { town: "Salmon Arm", province: "BC", population2021: 19400, lat: 50.7, lng: -119.27 },
  { town: "Fort St. John", province: "BC", population2021: 21500, lat: 56.25, lng: -120.85 },
  { town: "Williams Lake", province: "BC", population2021: 10900, lat: 52.13, lng: -122.14 },
  { town: "Squamish", province: "BC", population2021: 23800, lat: 49.7, lng: -123.16 },
  { town: "Parksville", province: "BC", population2021: 13600, lat: 49.32, lng: -124.31 },
  { town: "Powell River", province: "BC", population2021: 13900, lat: 49.84, lng: -124.52 },
  { town: "Courtenay", province: "BC", population2021: 28400, lat: 49.69, lng: -125.0 },
  { town: "Campbell River", province: "BC", population2021: 35500, lat: 50.02, lng: -125.24 },
  { town: "Terrace", province: "BC", population2021: 12000, lat: 54.52, lng: -128.6 },
];

/** 3° longitude bands, east first; inside a band, south to north. */
export const ANCHOR_TOWNS: readonly AnchorTown[] = SEED.filter(
  (t) => !(EXCLUDED_PROVINCES as readonly string[]).includes(t.province) && t.population2021 >= 10000 && t.population2021 <= 50000,
).sort((a, b) => {
  const band = (t: AnchorTown) => Math.floor(-t.lng / 3);
  return band(a) - band(b) || a.lat - b.lat;
});

/** Franchise / national brands Ralf excludes. Matched case- and accent-insensitively on the name and website. */
export const FRANCHISE_PATTERNS: readonly RegExp[] = [
  /re\s*\/?\s*max/,
  /royal\s*lepage/,
  /century\s*21/,
  /coldwell\s*banker/,
  /\bexp\b|exp\s*realty|exprealty/,
  /keller\s*williams|\bkw\b|kwrealty/,
  /sutton/,
  /engel\s*(&|and|\+)?\s*v(o|oe)lkers|engelvoelkers/,
  /sotheby/,
  /realty\s*executives/,
  /\bexit\s*realty|exitrealty/,
  /\bhomelife\b/,
  /\bvia\s*capitale\b/,
  /\bproprio\s*direct\b/,
  /\bpurplebricks\b/,
  /\bberkshire\s*hathaway\b/,
  /\bbetter\s*homes\s*(and|&)\s*gardens\b/,
];

export function normalizeName(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function isFranchiseName(name: string, website?: string | null): boolean {
  const hay = `${normalizeName(name)} ${normalizeName(website ?? "")}`;
  return FRANCHISE_PATTERNS.some((re) => re.test(hay));
}

/** Looks like a brokerage office rather than one agent's personal listing. */
export function looksLikeBrokerageOffice(name: string): boolean {
  const n = normalizeName(name);
  if (/personal real estate corporation|\bprec\b|\brealtor(s)?\b\s*$|\s-\s*realtor/.test(n)) return false;
  return /realty|real estate|immobili|courtier|properties|brokerage|realtors|homes|land|group|agence/.test(n);
}

export function websiteHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Score for ranking the 3 per market: rating weighted by review volume. */
export function brokerageScore(rating: number | null | undefined, count: number | null | undefined): number {
  const r = rating ?? 0;
  const c = count ?? 0;
  return r * Math.log10(c + 1);
}
