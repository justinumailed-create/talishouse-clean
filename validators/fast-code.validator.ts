export class FastCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FastCodeValidationError";
  }
}

const ALLOWED_NAME_PATTERN = /^[\p{L}\s'\-]+$/u;

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
    .replace(/[^\p{L}\s-]/gu, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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
  const firstInitial = input.firstName.charAt(0);
  const middleInitial = input.middleName?.charAt(0) ?? "";
  const lastInitial = input.lastName.charAt(0);

  return `${firstInitial}${middleInitial}${lastInitial}`;
}
