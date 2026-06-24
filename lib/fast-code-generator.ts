const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

function randLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function randDigit(): string {
  return DIGITS[Math.floor(Math.random() * DIGITS.length)];
}

export function generateFastCode(existingCodes: string[]): string {
  const seen = new Set(existingCodes.map((c) => c.toUpperCase().trim()));

  for (let attempt = 0; attempt < 500; attempt++) {
    const part1 = randLetter() + randLetter();
    const part2 = randLetter() + randLetter() + randLetter();
    const part3 = randDigit() + randDigit() + randDigit() + randDigit();
    const code = `${part1}-${part2}-${part3}`;
    if (!seen.has(code)) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique FAST Code after 500 attempts");
}
