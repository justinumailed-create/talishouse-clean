const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function generateRawSlug(): string {
  let slug = "";
  for (let i = 0; i < 4; i++) {
    slug += randomChar();
  }
  return slug;
}

export async function generateMapSiteSlug(
  existingSlugs: string[]
): Promise<string> {
  const seen = new Set(existingSlugs.map((s) => s.toUpperCase().trim()));

  for (let attempt = 0; attempt < 200; attempt++) {
    const raw = generateRawSlug();
    if (!seen.has(raw)) {
      return raw;
    }
  }

  for (let suffix = 2; suffix < 100; suffix++) {
    const raw = generateRawSlug();
    const candidate = `${raw}-${suffix}`;
    if (!seen.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique Mapsite™ slug after exhausting attempts");
}
