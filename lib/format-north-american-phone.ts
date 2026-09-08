/** Formats typed digits as (555) 555-5555. Caps at 10 digits. */
export function formatNorthAmericanPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function northAmericanPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}
