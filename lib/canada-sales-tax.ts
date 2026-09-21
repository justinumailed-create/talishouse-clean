/**
 * Canada GST / HST / PST (RST / QST) by province and territory.
 *
 * Source of truth: CRA sales-tax rates as of 2025-04-01
 * (Nova Scotia HST 14% effective that date). Combined CAD SaaS checkout
 * stays in CAD; Quebec GST and QST are both applied on the pre-tax price
 * (QST is not stacked on GST), so the effective combined rate is 14.975%.
 */

export const CANADA_TAX_RATES_AS_OF = "2025-04-01";

export type CanadaProvinceCode =
  | "AB"
  | "BC"
  | "MB"
  | "SK"
  | "QC"
  | "ON"
  | "NS"
  | "NB"
  | "NL"
  | "PE"
  | "NT"
  | "NU"
  | "YT";

export type CanadaTaxRegime = "hst" | "gst_only" | "gst_plus_provincial";

export type CanadaProvincialTaxLabel = "PST" | "RST" | "QST";

export interface CanadaTaxRate {
  code: CanadaProvinceCode;
  name: string;
  regime: CanadaTaxRegime;
  /** Federal GST share. 0 for HST provinces (tax is the combined HST). */
  gstRate: number;
  /** Provincial PST / RST / QST share. 0 for GST-only and HST provinces. */
  provincialRate: number;
  provincialLabel: CanadaProvincialTaxLabel | null;
  combinedRate: number;
  /** Compact checkout label: GST, HST, GST+PST, GST+RST, GST+QST. */
  displayLabel: string;
}

const GST_RATE = 0.05;

export const CANADA_TAX_RATES: Record<CanadaProvinceCode, CanadaTaxRate> = {
  AB: {
    code: "AB",
    name: "Alberta",
    regime: "gst_only",
    gstRate: GST_RATE,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: GST_RATE,
    displayLabel: "GST",
  },
  BC: {
    code: "BC",
    name: "British Columbia",
    regime: "gst_plus_provincial",
    gstRate: GST_RATE,
    provincialRate: 0.07,
    provincialLabel: "PST",
    combinedRate: 0.12,
    displayLabel: "GST+PST",
  },
  MB: {
    code: "MB",
    name: "Manitoba",
    regime: "gst_plus_provincial",
    gstRate: GST_RATE,
    provincialRate: 0.07,
    provincialLabel: "RST",
    combinedRate: 0.12,
    displayLabel: "GST+RST",
  },
  SK: {
    code: "SK",
    name: "Saskatchewan",
    regime: "gst_plus_provincial",
    gstRate: GST_RATE,
    provincialLabel: "PST",
    provincialRate: 0.06,
    combinedRate: 0.11,
    displayLabel: "GST+PST",
  },
  QC: {
    code: "QC",
    name: "Quebec",
    regime: "gst_plus_provincial",
    gstRate: GST_RATE,
    provincialRate: 0.09975,
    provincialLabel: "QST",
    combinedRate: 0.14975,
    displayLabel: "GST+QST",
  },
  ON: {
    code: "ON",
    name: "Ontario",
    regime: "hst",
    gstRate: 0,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: 0.13,
    displayLabel: "HST",
  },
  NS: {
    code: "NS",
    name: "Nova Scotia",
    regime: "hst",
    gstRate: 0,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: 0.14,
    displayLabel: "HST",
  },
  NB: {
    code: "NB",
    name: "New Brunswick",
    regime: "hst",
    gstRate: 0,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: 0.15,
    displayLabel: "HST",
  },
  NL: {
    code: "NL",
    name: "Newfoundland and Labrador",
    regime: "hst",
    gstRate: 0,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: 0.15,
    displayLabel: "HST",
  },
  PE: {
    code: "PE",
    name: "Prince Edward Island",
    regime: "hst",
    gstRate: 0,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: 0.15,
    displayLabel: "HST",
  },
  NT: {
    code: "NT",
    name: "Northwest Territories",
    regime: "gst_only",
    gstRate: GST_RATE,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: GST_RATE,
    displayLabel: "GST",
  },
  NU: {
    code: "NU",
    name: "Nunavut",
    regime: "gst_only",
    gstRate: GST_RATE,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: GST_RATE,
    displayLabel: "GST",
  },
  YT: {
    code: "YT",
    name: "Yukon",
    regime: "gst_only",
    gstRate: GST_RATE,
    provincialRate: 0,
    provincialLabel: null,
    combinedRate: GST_RATE,
    displayLabel: "GST",
  },
};

export const CANADA_PROVINCE_CODES = Object.keys(
  CANADA_TAX_RATES,
) as CanadaProvinceCode[];

export const CANADA_TAX_RATE_LIST: readonly CanadaTaxRate[] =
  CANADA_PROVINCE_CODES.map((code) => CANADA_TAX_RATES[code]);

const PROVINCE_NAME_ALIASES: Record<string, CanadaProvinceCode> = {
  ab: "AB",
  alberta: "AB",
  bc: "BC",
  "british columbia": "BC",
  "colombie-britannique": "BC",
  "colombie britannique": "BC",
  mb: "MB",
  manitoba: "MB",
  sk: "SK",
  saskatchewan: "SK",
  qc: "QC",
  quebec: "QC",
  québec: "QC",
  on: "ON",
  ontario: "ON",
  ns: "NS",
  "nova scotia": "NS",
  "nouvelle-écosse": "NS",
  "nouvelle ecosse": "NS",
  nb: "NB",
  "new brunswick": "NB",
  "nouveau-brunswick": "NB",
  "nouveau brunswick": "NB",
  nl: "NL",
  newfoundland: "NL",
  "newfoundland and labrador": "NL",
  "newfoundland & labrador": "NL",
  "terre-neuve": "NL",
  "terre-neuve-et-labrador": "NL",
  pe: "PE",
  pei: "PE",
  "p.e.i.": "PE",
  "p.e.i": "PE",
  "prince edward island": "PE",
  "île-du-prince-édouard": "PE",
  "ile-du-prince-edouard": "PE",
  nt: "NT",
  nwt: "NT",
  "n.w.t.": "NT",
  "n.w.t": "NT",
  "northwest territories": "NT",
  "territoires du nord-ouest": "NT",
  nu: "NU",
  nunavut: "NU",
  yt: "YT",
  yk: "YT",
  yukon: "YT",
};

function normalizeProvinceKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ");
}

function lookupProvinceKey(value: string): CanadaProvinceCode | null {
  const key = normalizeProvinceKey(value);
  if (!key) return null;
  return PROVINCE_NAME_ALIASES[key] ?? null;
}

/**
 * Resolve a Canadian province/territory from a code, full name, or address
 * fragment (for example "Markham, ON L3R 5W9" or "Homeville, Nova Scotia").
 * Two-letter codes only match as a whole value, a comma part, or an
 * uppercase token so English "on" in street names is not treated as Ontario.
 */
export function parseCanadaProvince(
  input: string | null | undefined,
): CanadaProvinceCode | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = lookupProvinceKey(trimmed);
  if (direct) return direct;

  const compactCode = trimmed.toUpperCase().replace(/[^A-Z]/g, "");
  if (compactCode.length === 2 && compactCode in CANADA_TAX_RATES) {
    return compactCode as CanadaProvinceCode;
  }

  const parts = trimmed.split(/[,/;|]+/).map((part) => part.trim());
  for (const part of parts) {
    const fromPart = lookupProvinceKey(part);
    if (fromPart) return fromPart;

    const tokens = part.split(/\s+/);
    for (const token of tokens) {
      if (/^[A-Z]{2}$/.test(token) && token in CANADA_TAX_RATES) {
        return token as CanadaProvinceCode;
      }
    }
  }

  const namesLongestFirst = Object.keys(PROVINCE_NAME_ALIASES)
    .filter((key) => key.length > 2)
    .sort((a, b) => b.length - a.length);
  const haystack = normalizeProvinceKey(trimmed);
  for (const name of namesLongestFirst) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(haystack)) {
      return PROVINCE_NAME_ALIASES[name];
    }
  }

  return null;
}

export function isCanadaProvinceCode(
  value: string | null | undefined,
): value is CanadaProvinceCode {
  return Boolean(value && value in CANADA_TAX_RATES);
}

export function resolveCanadaTaxRate(
  province: string | null | undefined,
): CanadaTaxRate | null {
  const code = parseCanadaProvince(province);
  return code ? CANADA_TAX_RATES[code] : null;
}

/** First valid Canadian province among place-of-supply candidates. */
export function resolvePlaceOfSupplyProvince(
  ...candidates: Array<string | null | undefined>
): CanadaProvinceCode | null {
  for (const candidate of candidates) {
    const parsed = parseCanadaProvince(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/** Human checkout copy: "HST", "GST", "GST + PST", "GST + RST", "GST + QST". */
export function canadaTaxWord(rate: CanadaTaxRate): string {
  if (rate.regime === "hst") return "HST";
  if (rate.regime === "gst_only") return "GST";
  return `GST + ${rate.provincialLabel}`;
}

export function formatCanadaTaxPercent(rate: number): string {
  const percent = Number((rate * 100).toFixed(3));
  return Number.isInteger(percent) ? `${percent}%` : `${percent}%`;
}

export function roundCadCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export interface CanadaSalesTaxBreakdown {
  province: CanadaProvinceCode;
  rate: CanadaTaxRate;
  gstAmount: number;
  provincialAmount: number;
  taxAmount: number;
  total: number;
  taxWord: string;
}

export function computeCanadaSalesTax(
  price: number,
  province: string,
): CanadaSalesTaxBreakdown {
  const rate = resolveCanadaTaxRate(province);
  if (!rate) {
    throw new Error(
      "A Canadian province or territory is required to calculate sales tax.",
    );
  }

  let gstAmount = 0;
  let provincialAmount = 0;
  if (rate.regime === "hst") {
    gstAmount = roundCadCents(price * rate.combinedRate);
  } else {
    gstAmount = roundCadCents(price * rate.gstRate);
    provincialAmount = roundCadCents(price * rate.provincialRate);
  }

  const taxAmount = roundCadCents(gstAmount + provincialAmount);
  return {
    province: rate.code,
    rate,
    gstAmount,
    provincialAmount,
    taxAmount,
    total: roundCadCents(price + taxAmount),
    taxWord: canadaTaxWord(rate),
  };
}

export function canadaTaxAmountFor(price: number, province: string): number {
  return computeCanadaSalesTax(price, province).taxAmount;
}

export function canadaTotalFor(price: number, province: string): number {
  return computeCanadaSalesTax(price, province).total;
}
