/**
 * Personal home page shown before a root account holder's Mapsite
 * (/talispros/home/<code>). Pure helpers: limits, normalisation, defaults.
 * Storage lives in supabase/migrations/113_mapsite_personal_home.sql.
 */

export const PERSONAL_HOME_PATH = "/talispros/home";

export const PERSONAL_HOME_LIMITS = {
  kicker: 80,
  headline: 120,
  writeUp: 2000,
  buttonLabel: 40,
  buttonHref: 500,
  buttons: 3,
} as const;

export type PersonalHomeButton = {
  label: string;
  href: string;
};

/** What the owner saved (every field optional; null = use the default). */
export type PersonalHomeContent = {
  imageUrl: string | null;
  kicker: string | null;
  headline: string | null;
  writeUp: string | null;
  buttons: PersonalHomeButton[];
  updatedAt: string | null;
};

/** What the page renders after defaults are applied. */
export type ResolvedPersonalHome = {
  imageUrl: string;
  kicker: string;
  headline: string;
  writeUp: string;
  buttons: PersonalHomeButton[];
  customized: {
    image: boolean;
    kicker: boolean;
    headline: boolean;
    writeUp: boolean;
    buttons: boolean;
  };
};

export function emptyPersonalHomeContent(): PersonalHomeContent {
  return {
    imageUrl: null,
    kicker: null,
    headline: null,
    writeUp: null,
    buttons: [],
    updatedAt: null,
  };
}

/** Personal home URL for a FAST Code (lower-case, like the claimed Mapsite path). */
export function personalHomePath(fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return `${PERSONAL_HOME_PATH}/${encodeURIComponent(code)}`;
}

export function isPersonalHomePath(pathname: string | null | undefined): boolean {
  return Boolean(pathname && pathname.startsWith(`${PERSONAL_HOME_PATH}/`));
}

/** Trim, collapse runs of blank lines, cap the length; empty → null. */
export function cleanPersonalHomeText(
  value: unknown,
  max: number,
  options: { multiline?: boolean } = {},
): string | null {
  if (typeof value !== "string") return null;
  let text = value.replace(/\r\n?/g, "\n");
  text = options.multiline
    ? text
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
    : text.replace(/\s+/g, " ");
  text = text.trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max).trimEnd() : text;
}

/**
 * Button links: site-relative paths ("/talisu/mkts"), http(s) URLs, mailto:
 * and tel:. Anything else (javascript:, data:, protocol-relative "//") is
 * rejected.
 */
export function normalizePersonalHomeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > PERSONAL_HOME_LIMITS.buttonHref) return null;
  if (/\s/.test(href)) return null;
  if (href.startsWith("/")) {
    return href.startsWith("//") || href.startsWith("/\\") ? null : href;
  }
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(href)) return href;
  if (/^tel:\+?[0-9().\- ]{3,}$/i.test(href)) return href;
  if (/^www\./i.test(href)) return normalizePersonalHomeHref(`https://${href}`);
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isExternalPersonalHomeHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Validated, de-duplicated, capped button list (bad rows are dropped). */
export function normalizePersonalHomeButtons(value: unknown): PersonalHomeButton[] {
  if (!Array.isArray(value)) return [];
  const out: PersonalHomeButton[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const label = cleanPersonalHomeText(row.label, PERSONAL_HOME_LIMITS.buttonLabel);
    const href = normalizePersonalHomeHref(row.href);
    if (!label || !href) continue;
    out.push({ label, href });
    if (out.length >= PERSONAL_HOME_LIMITS.buttons) break;
  }
  return out;
}

/** Validation for an owner save; returns field keys that were rejected. */
export function invalidPersonalHomeButtons(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const bad: number[] = [];
  value.forEach((raw, index) => {
    const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const labelRaw = typeof row.label === "string" ? row.label.trim() : "";
    const hrefRaw = typeof row.href === "string" ? row.href.trim() : "";
    if (!labelRaw && !hrefRaw) return; // empty row = ignored
    if (!cleanPersonalHomeText(labelRaw, PERSONAL_HOME_LIMITS.buttonLabel)) bad.push(index);
    else if (!normalizePersonalHomeHref(hrefRaw)) bad.push(index);
  });
  return bad;
}

export type PersonalHomeDefaults = {
  imageUrl: string;
  kicker: string;
  headline: string;
  writeUp: string;
  buttons: PersonalHomeButton[];
};

/** Owner name for the heading: first + last, else agent name, else title. */
export function personalHomeDisplayName(input: {
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  agentName?: string | null;
  propertyTitle?: string | null;
  fallback: string;
}): string {
  const owner = [input.ownerFirstName, input.ownerLastName]
    .map((part) => part?.trim() || "")
    .filter(Boolean)
    .join(" ");
  return (
    owner ||
    input.agentName?.trim() ||
    input.propertyTitle?.trim() ||
    input.fallback
  );
}

/** First usable photo: owner/agent photo, header image, gallery, fallback. */
export function personalHomeDefaultImage(input: {
  profileImageUrl?: string | null;
  headerImageUrl?: string | null;
  galleryImages?: Array<string | null | undefined> | null;
  fallback: string;
}): string {
  const candidates = [
    input.profileImageUrl,
    input.headerImageUrl,
    ...(input.galleryImages ?? []),
  ];
  for (const candidate of candidates) {
    const url = candidate?.trim() || "";
    if (url.startsWith("/") || /^https?:\/\//i.test(url)) return url;
  }
  return input.fallback;
}

/** Saved owner content over the Mapsite defaults. */
export function resolvePersonalHome(
  defaults: PersonalHomeDefaults,
  saved: PersonalHomeContent | null | undefined,
): ResolvedPersonalHome {
  const content = saved ?? emptyPersonalHomeContent();
  const buttons = normalizePersonalHomeButtons(content.buttons);
  return {
    imageUrl: content.imageUrl?.trim() || defaults.imageUrl,
    kicker: content.kicker?.trim() || defaults.kicker,
    headline: content.headline?.trim() || defaults.headline,
    writeUp: content.writeUp?.trim() || defaults.writeUp,
    buttons: buttons.length ? buttons : defaults.buttons,
    customized: {
      image: Boolean(content.imageUrl?.trim()),
      kicker: Boolean(content.kicker?.trim()),
      headline: Boolean(content.headline?.trim()),
      writeUp: Boolean(content.writeUp?.trim()),
      buttons: buttons.length > 0,
    },
  };
}

/** Fill "{name}" style placeholders in dictionary copy. */
export function fillPersonalHomeCopy(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

/** Cap SEO copy at a word boundary. */
export function clampSeoText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}
