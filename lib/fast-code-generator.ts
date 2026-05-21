export function extractInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

export function generateFastCode(
  firstName: string,
  lastName: string,
  existingCodes: string[]
): string {
  const prefix = extractInitials(firstName, lastName);

  const samePrefixCount = existingCodes.filter((code) =>
    code.toUpperCase().startsWith(prefix)
  ).length;

  let number = 14 + samePrefixCount;

  if (number === 13) {
    number = 14;
  }

  return `${prefix}${number}-ttv`;
}
