const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export function generateRegistrationNumber(existingNumbers: string[]): string {
  const seen = new Set(existingNumbers.map((n) => n.toUpperCase().trim()));

  for (let attempt = 0; attempt < 200; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += randomChar();
    }
    const regNum = `REG-${code}`;
    if (!seen.has(regNum)) {
      return regNum;
    }
  }

  const fallback = `REG-${Date.now().toString(36).toUpperCase()}`;
  return fallback;
}
