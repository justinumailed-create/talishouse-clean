/**
 * Personal home page shown before a root account holder's Mapsite
 * (/talispros/home/<code>). Pure helpers: limits, normalisation, defaults.
 * Storage lives in supabase/migrations/113_mapsite_personal_home.sql.
 */

export const PERSONAL_HOME_PATH = "/home";

export const PERSONAL_HOME_LIMITS = {
  kicker: 80,
  headline: 120,
  contactName: 80,
  writeUp: 2000,
  buttonLabel: 40,
  buttonHref: 500,
  buttons: 3,
} as const;

/** What a home-page button opens. Missing `kind` on older rows means a web link. */
export const PERSONAL_HOME_OPEN_KINDS = [
  "link",
  "pin",
  "bookshelf",
  "teb",
  "ebooks",
  "pins",
  "categories",
  "branding",
  "partners",
] as const;

export type PersonalHomeOpenKind = (typeof PERSONAL_HOME_OPEN_KINDS)[number];

/** Targets a visitor may see. Owner tools stay on the owner's own view. */
export const PERSONAL_HOME_VISITOR_OPENS = new Set<PersonalHomeOpenKind>([
  "link",
  "pin",
  "bookshelf",
  "teb",
]);

export type PersonalHomeButton = {
  label: string;
  href: string;
  kind: PersonalHomeOpenKind;
  pinId?: string;
};

export type PersonalHomeButtonContext = {
  mapsiteHref: string;
  bookshelfHref: string;
  tebHref: string | null;
  pinIds: readonly string[];
};

export function isPersonalHomeOpenKind(value: unknown): value is PersonalHomeOpenKind {
  return (
    typeof value === "string" &&
    (PERSONAL_HOME_OPEN_KINDS as readonly string[]).includes(value)
  );
}

export function isVisitorPersonalHomeOpen(kind: PersonalHomeOpenKind): boolean {
  return PERSONAL_HOME_VISITOR_OPENS.has(kind);
}

/** MP4 uploads stay under the 4.5 MB Vercel request cap. No charge for video. */
export const PERSONAL_HOME_VIDEO_MAX_BYTES = 4 * 1024 * 1024;

export type PersonalHomeSideMedia =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "embed"; url: string; provider: "youtube" | "vimeo" };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** YouTube or Vimeo page address, or null when it is neither. */
export function parsePersonalHomeEmbed(
  value: string,
): { provider: "youtube" | "vimeo"; id: string } | null {
  const raw = value.trim();
  if (!raw || raw.length > 500) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const fromQuery = url.searchParams.get("v") || "";
    const fromPath = url.pathname.split("/").filter(Boolean).pop() || "";
    const id = YOUTUBE_ID.test(fromQuery) ? fromQuery : fromPath;
    return YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter((part) => /^\d+$/.test(part)).pop() || "";
    return id ? { provider: "vimeo", id } : null;
  }
  return null;
}

export function personalHomeEmbedSrc(media: { provider: "youtube" | "vimeo"; url: string }): string | null {
  const parsed = parsePersonalHomeEmbed(media.url);
  if (!parsed) return null;
  if (parsed.provider === "youtube") {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: parsed.id,
      playsinline: "1",
      controls: "0",
      rel: "0",
    });
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?${params.toString()}`;
  }
  return `https://player.vimeo.com/video/${parsed.id}?autoplay=1&muted=1&loop=1&background=1`;
}

export function normalizePersonalHomeSideMedia(value: unknown): PersonalHomeSideMedia | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!url) return null;
  if (row.kind === "image" || row.kind === "video") {
    if (!/^https?:\/\//i.test(url) || url.length > 2048) return null;
    return { kind: row.kind, url };
  }
  if (row.kind === "embed" && parsePersonalHomeEmbed(url)) {
    return { kind: "embed", url, provider: parsePersonalHomeEmbed(url)!.provider };
  }
  return null;
}

/** What the owner saved (every field optional; null = use the default). */
export type PersonalHomeContent = {
  imageUrl: string | null;
  kicker: string | null;
  headline: string | null;
  /** Null means the page uses the owner name. */
  contactName: string | null;
  writeUp: string | null;
  buttons: PersonalHomeButton[];
  /** Null uses the top-button photo, then the Mapsite photo. */
  sideMedia: PersonalHomeSideMedia | null;
  updatedAt: string | null;
};

/** What the page renders after defaults are applied. */
export type ResolvedPersonalHome = {
  imageUrl: string;
  kicker: string;
  /** Empty when the owner has not written a headline. */
  headline: string;
  contactName: string;
  writeUp: string;
  buttons: PersonalHomeButton[];
  sideMedia: PersonalHomeSideMedia | null;
  customized: {
    image: boolean;
    kicker: boolean;
    headline: boolean;
    contactName: boolean;
    writeUp: boolean;
    buttons: boolean;
    side: boolean;
  };
};

export function emptyPersonalHomeContent(): PersonalHomeContent {
  return {
    imageUrl: null,
    kicker: null,
    headline: null,
    contactName: null,
    writeUp: null,
    buttons: [],
    sideMedia: null,
    updatedAt: null,
  };
}

/** Personal home URL for a FAST Code (lower-case, like the claimed Mapsite path). */
export function personalHomePath(fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return `${PERSONAL_HOME_PATH}/${encodeURIComponent(code)}`;
}

/** Event the navbar account pill fires to open the editor on the home page. */
export const PERSONAL_HOME_OPEN_EDITOR_EVENT = "talispros:personal-home-open-editor";

/** Unsaved headline and contact name, so the page can preview them before a save. */
export const PERSONAL_HOME_DRAFT_EVENT = "talispros:personal-home-draft";

export type PersonalHomeDraft = {
  headline: string;
  contactName: string;
};

/** Personal home page with the owner editor opened on arrival. */
export function personalHomeEditPath(fastCode: string): string {
  return `${personalHomePath(fastCode)}?edit=1`;
}

/** Account holder pill shown in the navbar (owners only). */
export type PersonalHomeOwnerPill = {
  name: string;
  imageUrl: string;
  editHref: string;
};

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

function readOpenKind(value: unknown): PersonalHomeOpenKind {
  return isPersonalHomeOpenKind(value) ? value : "link";
}

/** Href for a button. Web links use the saved address. Every other kind is rebuilt here. */
export function personalHomeOpenHref(
  button: { kind: PersonalHomeOpenKind; href?: string | null; pinId?: string | null },
  context: PersonalHomeButtonContext,
): string | null {
  if (button.kind === "link") return normalizePersonalHomeHref(button.href);
  if (button.kind === "pin") {
    const pinId = button.pinId?.trim() || "";
    if (!pinId || !context.pinIds.includes(pinId)) return null;
    const base = context.mapsiteHref.split("#")[0] || context.mapsiteHref;
    const [path, query = ""] = base.split("?");
    const params = new URLSearchParams(query);
    params.set("pin", pinId);
    return `${path}?${params.toString()}`;
  }
  if (button.kind === "bookshelf") return normalizePersonalHomeHref(context.bookshelfHref);
  if (button.kind === "teb") return normalizePersonalHomeHref(context.tebHref);
  if (!context.mapsiteHref.startsWith("/")) return null;
  const base = context.mapsiteHref.split("#")[0] || context.mapsiteHref;
  const [path, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("dashboard", button.kind);
  return `${path}?${params.toString()}`;
}

/** Validated, de-duplicated, capped button list (bad rows are dropped). */
export function normalizePersonalHomeButtons(
  value: unknown,
  context?: PersonalHomeButtonContext,
): PersonalHomeButton[] {
  if (!Array.isArray(value)) return [];
  const out: PersonalHomeButton[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const label = cleanPersonalHomeText(row.label, PERSONAL_HOME_LIMITS.buttonLabel);
    if (!label) continue;
    const kind = readOpenKind(row.kind);
    const pinId = typeof row.pinId === "string" ? row.pinId.trim() : "";
    const href = context
      ? personalHomeOpenHref({ kind, href: typeof row.href === "string" ? row.href : "", pinId }, context)
      : kind === "link"
        ? normalizePersonalHomeHref(row.href)
        : normalizePersonalHomeHref(row.href);
    if (!href) continue;
    out.push(kind === "pin" && pinId ? { label, href, kind, pinId } : { label, href, kind });
    if (out.length >= PERSONAL_HOME_LIMITS.buttons) break;
  }
  return out;
}

function buttonRowIsBlank(row: Record<string, unknown>): boolean {
  const labelRaw = typeof row.label === "string" ? row.label.trim() : "";
  const hrefRaw = typeof row.href === "string" ? row.href.trim() : "";
  const pinId = typeof row.pinId === "string" ? row.pinId.trim() : "";
  const kind = readOpenKind(row.kind);
  return !labelRaw && !hrefRaw && !pinId && kind === "link";
}

/** Validation for an owner save; returns field keys that were rejected. */
export function invalidPersonalHomeButtons(
  value: unknown,
  context?: PersonalHomeButtonContext,
): number[] {
  if (!Array.isArray(value)) return [];
  const bad: number[] = [];
  value.forEach((raw, index) => {
    const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    if (buttonRowIsBlank(row)) return;
    const labelRaw = typeof row.label === "string" ? row.label.trim() : "";
    if (!cleanPersonalHomeText(labelRaw, PERSONAL_HOME_LIMITS.buttonLabel)) {
      bad.push(index);
      return;
    }
    const kind = readOpenKind(row.kind);
    const pinId = typeof row.pinId === "string" ? row.pinId.trim() : "";
    const href = context
      ? personalHomeOpenHref(
          { kind, href: typeof row.href === "string" ? row.href : "", pinId },
          context,
        )
      : kind === "link"
        ? normalizePersonalHomeHref(row.href)
        : normalizePersonalHomeHref(row.href);
    if (!href) bad.push(index);
  });
  return bad;
}

export type PersonalHomeDefaults = {
  imageUrl: string;
  kicker: string;
  headline: string;
  contactName: string;
  writeUp: string;
  buttons: PersonalHomeButton[];
};

/**
 * Account-type labels stored in build_requests.company, plus generic titles.
 * These are not a brokerage name.
 */
const GENERIC_BROKERAGE_NAME =
  /^(mapsite|demo mapsite|demo-mapsite|home pin address|licensed real estate professional|for-sale-by-owner|for sale by owner|real estate broker or owner|assisted build request|adpro service provider|fsbo|listings|brokers|adpro)$/i;

/** Street addresses stored in property_title are not the brokerage. */
export function looksLikeStreetAddress(value: string): boolean {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (/^\d+\s+\S/.test(text)) return true;
  if (/\d/.test(text) && text.includes(",")) return true;
  return /\b(rd|road|st|street|ave|avenue|blvd|boulevard|highway|hwy|route|lot)\b/i.test(
    text,
  );
}

function cleanIdentity(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

/**
 * Public name for a FAST Code Mapsite home page.
 * Prefer the brokerage stored on the Mapsite (property title, which system
 * FAST Codes use as the firm) or a real company name. Fall back to the
 * person only when neither is a brokerage name.
 */
export function mapsiteBrokerageDisplayName(input: {
  brokerageName?: string | null;
  propertyTitle?: string | null;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  agentName?: string | null;
  fallback: string;
}): string {
  const person = personalHomeDisplayName({
    ownerFirstName: input.ownerFirstName,
    ownerLastName: input.ownerLastName,
    agentName: input.agentName,
    propertyTitle: null,
    fallback: "",
  });
  const personKey = person.toLowerCase();
  const candidates = [input.propertyTitle, input.brokerageName];
  for (const raw of candidates) {
    const name = cleanIdentity(raw);
    if (!name) continue;
    if (GENERIC_BROKERAGE_NAME.test(name)) continue;
    if (personKey && name.toLowerCase() === personKey) continue;
    if (looksLikeStreetAddress(name)) continue;
    return name;
  }
  return person || input.fallback;
}

/** Owner name: first + last, else agent name, else title. */
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
    headline: content.headline?.trim() || "",
    contactName: content.contactName?.trim() || defaults.contactName,
    writeUp: content.writeUp?.trim() || defaults.writeUp,
    buttons: buttons.length ? buttons : defaults.buttons,
    sideMedia: content.sideMedia,
    customized: {
      image: Boolean(content.imageUrl?.trim()),
      kicker: Boolean(content.kicker?.trim()),
      headline: Boolean(content.headline?.trim()),
      contactName: Boolean(content.contactName?.trim()),
      writeUp: Boolean(content.writeUp?.trim()),
      buttons: buttons.length > 0,
      side: Boolean(content.sideMedia),
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
