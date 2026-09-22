export class FastCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FastCodeValidationError";
  }
}

/** Letters, spaces, apostrophes, hyphens, and given-name separators & / +. */
const ALLOWED_NAME_PATTERN = /^[\p{L}\s'’`&+\-]+$/u;

/**
 * Separators between given names. "and" is a whole word so names like
 * "Andrew" stay a single given name.
 */
const GIVEN_NAME_SEPARATOR = /\s*(?:&|\+|\band\b)\s*/iu;

const GIVEN_NAME_SEPARATOR_PRESENT = /[&+]|\band\b/iu;

/**
 * Issued FAST Codes are 2–3 letters plus a sequence (`lrg01`).
 * When a name has more than two given names, keep the first two initials.
 */
const MAX_GIVEN_INITIALS = 2;

export interface NormalizedFastCodeNameInput {
  firstName: string;
  middleName: string | null;
  lastName: string;
}

export function normalizeNamePart(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/&/g, " & ")
    .replace(/\+/g, " + ")
    .replace(/[^\p{L}\s&+\-]/gu, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function firstLetter(normalized: string): string {
  return normalized.match(/\p{L}/u)?.[0] ?? "";
}

/** First letter of each given name. Separators never become code characters. */
export function givenNameInitials(normalizedPart: string): string {
  return normalizedPart
    .split(GIVEN_NAME_SEPARATOR)
    .map((segment) => firstLetter(segment.trim()))
    .filter(Boolean)
    .join("");
}

export function validateNamePart(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new FastCodeValidationError(`${fieldName} is required`);
  }

  if (/\d/.test(trimmed)) {
    throw new FastCodeValidationError(`${fieldName} cannot contain numbers`);
  }

  if (!ALLOWED_NAME_PATTERN.test(trimmed)) {
    throw new FastCodeValidationError(`${fieldName} contains invalid characters`);
  }

  const normalized = normalizeNamePart(trimmed);

  if (!normalized || !/\p{L}/u.test(normalized)) {
    throw new FastCodeValidationError(`${fieldName} is required`);
  }

  return normalized;
}

export function validateAndNormalizeFastCodeInput(input: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}): NormalizedFastCodeNameInput {
  const firstName = validateNamePart(input.firstName, "firstName");
  const lastName = validateNamePart(input.lastName, "lastName");
  const middleName = input.middleName?.trim()
    ? validateNamePart(input.middleName, "middleName")
    : null;

  return { firstName, middleName, lastName };
}

export function extractInitials(input: NormalizedFastCodeNameInput): string {
  const given = (
    givenNameInitials(input.firstName) +
    (input.middleName ? givenNameInitials(input.middleName) : "")
  ).slice(0, MAX_GIVEN_INITIALS);
  const last = firstLetter(input.lastName);

  return `${given}${last}`.replace(/[^a-z]/g, "");
}

/**
 * Split a single display name into the first/last fields FAST Code generation
 * expects. `&`, `+`, and "and" mark extra given names; the final word is the
 * shared surname ("Lydia & Richard Gaertner" → "Lydia & Richard" / "Gaertner").
 */
export function splitPersonName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  if (GIVEN_NAME_SEPARATOR_PRESENT.test(normalized)) {
    const parts = normalized.split(" ");
    const lastName = parts[parts.length - 1] ?? "";
    const firstName = parts.slice(0, -1).join(" ").trim();
    if (firstName && /\p{L}/u.test(firstName) && /\p{L}/u.test(lastName)) {
      return { firstName, lastName };
    }
  }

  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
