/**
 * North American Numbering Plan (NANP) phone helpers.
 *
 * Accepts 10 digits with an optional leading +1 / 1 country code, where both
 * the area code (NPA) and exchange (NXX) start with 2–9. Common separators
 * (spaces, dashes, dots, parentheses) are allowed, e.g.
 * (555) 555-5555 · 555-555-5555 · 555.555.5555 · +1 555 555 5555.
 */

export const NANP_PHONE_ERROR =
  "Enter a valid US/Canada phone number, e.g. (555) 555-5555.";

/** Characters allowed besides digits in a typed phone number. */
const ALLOWED_PHONE_CHARS = /^[\d\s().+-]*$/;

/** Returns the 10-digit national number, or null when not a valid NANP number. */
export function parseNanpPhone(input: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw || !ALLOWED_PHONE_CHARS.test(raw)) return null;
  // "+" is only allowed as the very first character (for +1).
  if (raw.indexOf("+") > 0 || (raw.startsWith("+") && !/^\+\s*1/.test(raw))) {
    return null;
  }
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return digits;
}

export function isValidNanpPhone(input: string): boolean {
  return parseNanpPhone(input) !== null;
}

/** Canonical display format: +1 (555) 555-5555. Null if invalid. */
export function formatNanpPhone(input: string): string | null {
  const d = parseNanpPhone(input);
  if (!d) return null;
  return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Light as-you-type formatter: (555) 555-5555, keeping a leading +1 if typed.
 * Never blocks input beyond 10 national digits.
 */
export function formatNanpPhoneInput(input: string): string {
  const raw = String(input ?? "");
  const hasPlusOne = /^\s*\+\s*1/.test(raw);
  let digits = raw.replace(/\D/g, "");
  let prefix = "";
  if (hasPlusOne) {
    digits = digits.slice(1);
    prefix = "+1 ";
  } else if (digits.length > 10 && digits.startsWith("1")) {
    digits = digits.slice(1);
    prefix = "1 ";
  } else if (digits.startsWith("1") && digits.length <= 10 && /^\s*1[\s.-]/.test(raw)) {
    digits = digits.slice(1);
    prefix = "1 ";
  }
  digits = digits.slice(0, 10);
  // Nothing national typed yet: keep only "+" / "1" so backspacing works.
  if (!digits) return raw.replace(/[^\d+]/g, "").slice(0, 2);
  if (digits.length < 4) return `${prefix}(${digits}`;
  if (digits.length < 7) return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
