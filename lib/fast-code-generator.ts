const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export function generateFastCode(existingCodes: string[]): string {
  const seen = new Set(existingCodes.map((c) => c.toUpperCase().trim()));

  for (let attempt = 0; attempt < 200; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += randomChar();
    }
    if (!seen.has(code)) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique FAST code after 200 attempts");
}
