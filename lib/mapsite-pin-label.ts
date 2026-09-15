/**
 * Public Mapsite™ pin / flag labels must show a lot or street location,
 * never the registrant or agent personal name.
 */

export type MapsitePinLabelFields = {
  /** Explicit lot / pin label (e.g. build-request future_pin_label). */
  lotLabel?: string | null;
  propertyTitle?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  ownerName?: string | null;
  agentName?: string | null;
  /** Last resort when no location string exists (FAST Code, "Location"). */
  fallback?: string | null;
};

const STREET_OR_LOT_TOKEN =
  /\b(lot|rd\.?|road|st\.?|street|ave\.?|avenue|dr\.?|drive|ln\.?|lane|blvd\.?|boulevard|hwy\.?|highway|cres\.?|crescent|ct\.?|court|pl\.?|place|way|trl\.?|trail|cir\.?|circle|ter\.?|terrace|pkwy\.?|parkway)\b/i;

const REGION_ABBREVIATIONS = new Set([
  "NS",
  "NB",
  "NL",
  "PE",
  "QC",
  "ON",
  "MB",
  "SK",
  "AB",
  "BC",
  "YT",
  "NT",
  "NU",
  "PEI",
  "USA",
  "UK",
  "US",
  "CA",
]);

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:\s]+$/g, "").trim();
}

function normalizeComparable(value: string): string {
  return collapseWhitespace(value)
    .replace(/[™®]/g, "")
    .replace(/\s*mapsite\s*$/i, "")
    .replace(/[.,]/g, "")
    .toLowerCase();
}

function knownPersonNames(
  fields: Pick<MapsitePinLabelFields, "ownerName" | "agentName">,
): string[] {
  return [fields.ownerName, fields.agentName]
    .map((name) => collapseWhitespace(name || ""))
    .filter(Boolean);
}

/** True when the string is (or is derived from) a person's name. */
export function isPersonalNameLabel(
  label: string | null | undefined,
  knownNames: (string | null | undefined)[] = [],
): boolean {
  const value = collapseWhitespace(label || "");
  if (!value) return false;

  const comparable = normalizeComparable(value);
  for (const name of knownNames) {
    const known = collapseWhitespace(name || "");
    if (!known) continue;
    if (comparable === normalizeComparable(known)) return true;
  }

  if (STREET_OR_LOT_TOKEN.test(value) || /\d/.test(value) || value.includes(",")) {
    return false;
  }

  const words = value.replace(/[™®]/g, "").trim().split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;

  const nameWord = /^(?:[A-Z](?:[a-z'’.-]*|[.])|[A-Z]'[A-Z][a-z'’-]+)$/;
  return words.every((word) => nameWord.test(word) || /^[A-Z][a-z'’-]+$/.test(word));
}

/**
 * Lot number, street address, or comma-separated place string — not a
 * marketing headline or personal name.
 */
export function isFormalLotOrAddressLabel(
  label: string | null | undefined,
  knownNames: (string | null | undefined)[] = [],
): boolean {
  const value = collapseWhitespace(label || "");
  if (!value) return false;
  if (isPersonalNameLabel(value, knownNames)) return false;
  if (/\blot\s*#?\s*\d+/i.test(value)) return true;
  const hasStreet = STREET_OR_LOT_TOKEN.test(value);
  const hasDigit = /\d/.test(value);
  const hasCommaPlace = value.includes(",");
  if (hasStreet && (hasDigit || hasCommaPlace)) return true;
  if (hasDigit && hasCommaPlace) return true;
  return false;
}

export function formatMapsiteLocationLabel(value: string): string {
  const trimmed = stripTrailingPunctuation(collapseWhitespace(value));
  if (!trimmed) return "";

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  const upperRatio =
    letters.length === 0
      ? 0
      : [...letters].filter((char) => char === char.toUpperCase()).length /
        letters.length;
  if (upperRatio < 0.85) return trimmed;

  return trimmed
    .toLowerCase()
    .replace(/\b([a-z])/g, (char) => char.toUpperCase())
    .replace(/\b([A-Za-z]{2,4})\b/g, (word) =>
      REGION_ABBREVIATIONS.has(word.toUpperCase()) ? word.toUpperCase() : word,
    );
}

function firstFormalLabel(
  candidates: (string | null | undefined)[],
  knownNames: (string | null | undefined)[],
): string | null {
  for (const candidate of candidates) {
    const value = collapseWhitespace(candidate || "");
    if (isFormalLotOrAddressLabel(value, knownNames)) {
      return formatMapsiteLocationLabel(value);
    }
  }
  return null;
}

function composeAddressLabel(fields: MapsitePinLabelFields): string {
  const address = collapseWhitespace(fields.address || "");
  const extras = [fields.city, fields.province, fields.country]
    .map((part) => collapseWhitespace(part || ""))
    .filter(Boolean)
    .filter((part) => {
      if (!address) return true;
      return !address.toLowerCase().includes(part.toLowerCase());
    });

  const composed = [address, ...extras].filter(Boolean).join(", ");
  return formatMapsiteLocationLabel(composed);
}

/** First candidate that is not a personal name (for stored titles). */
export function firstNonPersonalMapsiteLabel(
  candidates: (string | null | undefined)[],
  knownNames: (string | null | undefined)[] = [],
): string | null {
  for (const candidate of candidates) {
    const value = collapseWhitespace(candidate || "");
    if (value && !isPersonalNameLabel(value, knownNames)) return value;
  }
  return null;
}

/**
 * Auto-fetched public pin / flag text: lot or street location, never a person.
 */
export function mapsitePublicPinLabel(fields: MapsitePinLabelFields): string {
  const knownNames = knownPersonNames(fields);

  const formal = firstFormalLabel(
    [fields.lotLabel, fields.propertyTitle],
    knownNames,
  );
  if (formal) return formal;

  const composed = composeAddressLabel(fields);
  if (composed) return composed;

  const fallback = collapseWhitespace(fields.fallback || "");
  if (fallback && !isPersonalNameLabel(fallback, knownNames)) {
    return formatMapsiteLocationLabel(fallback);
  }

  return "Location";
}
