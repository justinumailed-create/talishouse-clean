/** RM22 Talisbook™ self-serve template — one product sheet + editable stub slots. */

import type { SelfServicePageRowContent } from "@/lib/talisbooks/self-service-page-plan";
import { RM22_TEMPLATE_ID } from "@/lib/talisbooks/rm22-layout";

export const RM22_TEMPLATE_ROOT = "/talisbooks/templates/rm22";
export const RM22_PAGE_WIDTH = 1920;
export const RM22_PAGE_HEIGHT = 1080;
export const RM22_COVER_WIDTH = 1080;
export const RM22_COVER_HEIGHT = 1920;
export const RM22_PHOTO_CAPTION_COUNT = 6;
/**
 * Last two interior landscapes, always placed immediately before the back cover.
 * Positions are relative (not hardcoded book pages such as 22–23 / 24–25).
 */
export const RM22_PROTECTED_ENDING_SPREADS = 2;

export type Rm22ProductId = "t-dome" | "g-house" | "t-house";

export const RM22_DEFAULT_PRODUCT_ID: Rm22ProductId = "t-dome";

export const RM22_PRODUCTS = [
  {
    id: "t-dome" as const,
    label: "T-Dome",
    href: `${RM22_TEMPLATE_ROOT}/products/t-dome.jpg`,
  },
  {
    id: "g-house" as const,
    label: "G-House",
    href: `${RM22_TEMPLATE_ROOT}/products/g-house.jpg`,
  },
  {
    id: "t-house" as const,
    label: "T-House",
    href: `${RM22_TEMPLATE_ROOT}/products/t-house.jpg`,
  },
] as const;

/**
 * Flattened design comps (green + baked titles/captions). Never use these as
 * image-slot sources — they mix template overlay with the photo region.
 * Image slots are user photos or an empty placeholder; text is overlay.
 */
export const RM22_DESIGN_COMPS = {
  front: `${RM22_TEMPLATE_ROOT}/overlays/front.jpg`,
  intro: `${RM22_TEMPLATE_ROOT}/interiors/intro.jpg`,
  caption: `${RM22_TEMPLATE_ROOT}/interiors/caption.jpg`,
  intrinsic: `${RM22_TEMPLATE_ROOT}/interiors/intrinsic.jpg`,
  outro: `${RM22_TEMPLATE_ROOT}/interiors/outro.jpg`,
} as const;

export const RM22_ASSETS = {
  /** Photo-only default portrait. Cover copy is drawn from text slots. */
  agent: `${RM22_TEMPLATE_ROOT}/overlays/agent.jpg`,
  intro: "",
  caption: "",
  intrinsic: "",
  outro: "",
  front: "",
} as const;

export function isRm22PhotoPlaceholderUrl(
  url: string | null | undefined,
): boolean {
  const value = url?.trim() || "";
  if (!value) return true;
  const path = value.startsWith("http")
    ? (() => {
        try {
          return new URL(value).pathname;
        } catch {
          return value;
        }
      })()
    : value;
  return (
    path.includes("/talisbooks/templates/rm22/interiors/") ||
    path.endsWith("/overlays/front.jpg")
  );
}

/** Photo slots store user images only — never flattened design-comp JPEGs. */
export function rm22PhotoSlotUrl(url: string | null | undefined): string {
  const value = url?.trim() || "";
  return isRm22PhotoPlaceholderUrl(value) ? "" : value;
}

export function isRm22ProductId(value: string): value is Rm22ProductId {
  return RM22_PRODUCTS.some((product) => product.id === value);
}

export function rm22ProductById(id: Rm22ProductId | string | null | undefined) {
  const match = RM22_PRODUCTS.find((product) => product.id === id);
  return match ?? RM22_PRODUCTS[0];
}

export const RM22_DEFAULT_COPY = {
  frontTitle: "",
  frontSubtitle: "A prime location",
  frontPriceLine: "Inquire for price per acre.",
  frontTagline: "Available with or without Tiny Home, turn key optional",
  backKicker: "Your Marketing Manager",
  agentName: "Your Name",
  agentPhone: "",
  introTitle: "Welcome…!",
  introCaption: "Intro Page",
  photoCaptions: ["", "", "", "", "", ""] as const,
  intrinsicTitle: "Intrinsic Value",
  intrinsicCaption: "",
  intrinsicBody: "",
  intrinsicSignoff: "The Professional Team",
  outroTitle: "The Parting Shot…!",
  outroCaption: "Outro Page",
} as const;

const GENERIC_LOT_BLURB =
  /^(property|primary attribute|a prime location|mapsite™?|lot \+ optional tiny home|your (listing|property))$/i;

/** Street + community headline. Never the word "Property". */
export function formatRm22CoverAddressHeadline(
  address?: string | null,
): string {
  const raw = address?.trim() || "";
  if (!raw || GENERIC_LOT_BLURB.test(raw)) return "";
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return raw;
}

export function styleRm22CoverLotBlurb(text: string): string {
  const inner = text.trim().replace(/^\*+\s*|\s*\*+$/g, "").trim();
  if (!inner) return `*${RM22_DEFAULT_COPY.frontSubtitle}*`;
  return `*${inner}*`;
}

/** Lot-dependent italic lime line (title, then a short pin writeup). */
export function formatRm22CoverLotBlurb(input?: {
  title?: string | null;
  writeup?: string | null;
}): string {
  const title = input?.title?.trim() || "";
  if (title && !GENERIC_LOT_BLURB.test(title) && title.length <= 72) {
    return styleRm22CoverLotBlurb(title);
  }
  const writeup = input?.writeup?.trim() || "";
  if (writeup) {
    const first = writeup.split(/[.!?\n]/)[0]?.trim() || "";
    if (first && first.length <= 72 && !GENERIC_LOT_BLURB.test(first)) {
      return styleRm22CoverLotBlurb(first);
    }
  }
  return styleRm22CoverLotBlurb(RM22_DEFAULT_COPY.frontSubtitle);
}

/** Price per acre when known; otherwise a clean inquire line. */
export function formatRm22CoverPriceLine(price?: string | null): string {
  const raw = price?.trim() || "";
  if (!raw) return RM22_DEFAULT_COPY.frontPriceLine;
  if (/inquire/i.test(raw)) {
    return /per\s+acre/i.test(raw)
      ? raw.replace(/\.?$/, ".")
      : "Inquire for price per acre.";
  }
  const stripped = raw.replace(/\.?$/, "");
  if (/per\s+acre/i.test(stripped)) {
    return /^from\s+/i.test(stripped) ? `${stripped}.` : `From ${stripped}.`;
  }
  const amount = /^from\s+/i.test(stripped)
    ? stripped
    : `From ${stripped}`;
  return `${amount} per acre.`;
}

export type Rm22InteriorRole =
  | "product-sheet"
  | "intro"
  | "photo-caption"
  | "intrinsic"
  | "outro";

export type Rm22InteriorPlanItem = {
  role: Rm22InteriorRole;
  fileName: string;
  assetHref: string;
  image: File | null;
  title?: string;
  caption?: string;
  body?: string;
  signoff?: string;
  productId?: Rm22ProductId;
};

export type Rm22SlotState = {
  productId: Rm22ProductId;
  frontImage: File | null;
  frontImageUrl: string | null;
  frontTitle: string;
  frontSubtitle: string;
  frontPriceLine: string;
  frontTagline: string;
  backAgentImage: File | null;
  backAgentImageUrl: string | null;
  agencyLogo: File | null;
  agencyLogoUrl: string | null;
  backKicker: string;
  agentName: string;
  agentPhone: string;
  introImage: File | null;
  introImageUrl: string | null;
  introTitle: string;
  introCaption: string;
  photoImages: Array<File | null>;
  photoImageUrls: Array<string | null>;
  photoCaptions: string[];
  intrinsicImage: File | null;
  intrinsicImageUrl: string | null;
  intrinsicTitle: string;
  intrinsicCaption: string;
  intrinsicBody: string;
  intrinsicSignoff: string;
  outroImage: File | null;
  outroImageUrl: string | null;
  outroTitle: string;
  outroCaption: string;
};

export type Rm22CoverBandInput = {
  address?: string | null;
  lotTitle?: string | null;
  lotWriteup?: string | null;
  priceLine?: string | null;
  tagline?: string | null;
};

/**
 * Self-serve front-cover caption lines from mapsite/onboarding.
 * Title = address headline (street + community). Subtitle = lot blurb.
 */
export function rm22CoverBandFromOnboarding(input?: Rm22CoverBandInput): {
  frontTitle: string;
  frontSubtitle: string;
  frontPriceLine: string;
  frontTagline: string;
} {
  return {
    frontTitle: formatRm22CoverAddressHeadline(input?.address),
    frontSubtitle: formatRm22CoverLotBlurb({
      title: input?.lotTitle,
      writeup: input?.lotWriteup,
    }),
    frontPriceLine: formatRm22CoverPriceLine(input?.priceLine),
    frontTagline: input?.tagline?.trim() || RM22_DEFAULT_COPY.frontTagline,
  };
}

/** Real Intrinsic Value copy: the lot plus the chosen product (T-Dome / G-House / T-House). */
export function defaultRm22IntrinsicBody(input: {
  productLabel: string;
  lotTitle?: string | null;
  address?: string | null;
}): string {
  const product = input.productLabel.trim() || "T-Dome";
  const lotBlurb = input.lotTitle?.trim()
    ? input.lotTitle.trim().replace(/^\*+\s*|\s*\*+$/g, "")
    : "";
  const lot =
    lotBlurb && !GENERIC_LOT_BLURB.test(lotBlurb) ? lotBlurb : "this lot";
  const whereRaw = input.address?.trim() || "";
  const where =
    whereRaw && whereRaw !== RM22_DEFAULT_COPY.frontTitle ? whereRaw : "";
  const place = where ? ` at ${where}` : "";
  return [
    `The lasting value of ${lot}${place} is the land itself — and the choice of what you place on it.`,
    `A ${product} sits lightly on the acreage, four-season ready, and can be delivered turn-key or as a kit. Keep the property as land, or add the ${product} when you are ready.`,
    `That option — land with or without a tiny home — is the intrinsic value of the offering.`,
  ].join("\n\n");
}

export function createRm22SlotState(input?: {
  agentName?: string;
  agentPhone?: string;
  productId?: Rm22ProductId;
  address?: string;
  lotTitle?: string;
  lotWriteup?: string;
  priceLine?: string;
  tagline?: string;
  agencyLogoUrl?: string;
}): Rm22SlotState {
  const agentName = input?.agentName?.trim() || RM22_DEFAULT_COPY.agentName;
  const agentPhone = input?.agentPhone?.trim() || RM22_DEFAULT_COPY.agentPhone;
  const productId = input?.productId ?? RM22_DEFAULT_PRODUCT_ID;
  const product = rm22ProductById(productId);
  const cover = rm22CoverBandFromOnboarding({
    address: input?.address,
    lotTitle: input?.lotTitle,
    lotWriteup: input?.lotWriteup,
    priceLine: input?.priceLine,
    tagline: input?.tagline,
  });
  return {
    productId,
    frontImage: null,
    frontImageUrl: null,
    frontTitle: cover.frontTitle,
    frontSubtitle: cover.frontSubtitle,
    frontPriceLine: cover.frontPriceLine,
    frontTagline: cover.frontTagline,
    backAgentImage: null,
    backAgentImageUrl: null,
    agencyLogo: null,
    agencyLogoUrl: input?.agencyLogoUrl?.trim() || null,
    backKicker: RM22_DEFAULT_COPY.backKicker,
    agentName,
    agentPhone,
    introImage: null,
    introImageUrl: null,
    introTitle: RM22_DEFAULT_COPY.introTitle,
    introCaption: RM22_DEFAULT_COPY.introCaption,
    photoImages: Array.from({ length: RM22_PHOTO_CAPTION_COUNT }, () => null),
    photoImageUrls: Array.from({ length: RM22_PHOTO_CAPTION_COUNT }, () => null),
    photoCaptions: [...RM22_DEFAULT_COPY.photoCaptions],
    intrinsicImage: null,
    intrinsicImageUrl: null,
    intrinsicTitle: RM22_DEFAULT_COPY.intrinsicTitle,
    intrinsicCaption: RM22_DEFAULT_COPY.intrinsicCaption,
    intrinsicBody: defaultRm22IntrinsicBody({
      productLabel: product.label,
      lotTitle: cover.frontSubtitle,
      address: cover.frontTitle,
    }),
    intrinsicSignoff: RM22_DEFAULT_COPY.intrinsicSignoff,
    outroImage: null,
    outroImageUrl: null,
    outroTitle: RM22_DEFAULT_COPY.outroTitle,
    outroCaption: RM22_DEFAULT_COPY.outroCaption,
  };
}

function photoCaptionCount(slots: Rm22SlotState): number {
  return Math.max(
    RM22_PHOTO_CAPTION_COUNT,
    slots.photoImages.length,
    slots.photoCaptions.length,
  );
}

/**
 * Ordered interior landscapes for the self-serve RM22 book.
 *
 * Always:
 *   1. chosen product sheet (T-Dome / G-House / T-House) — first interior
 *   2. Welcome intro
 *   3. photo-caption spreads (count may vary)
 *   4. Intrinsic Value — second-to-last interior (immediately before Parting Shot)
 *   5. The Parting Shot…! — last interior before the back cover
 *
 * Ending order is relative to the back cover, never hardcoded book pages
 * (do not assume 22–23 / 24–25). Raising the page cap must not drop 4–5.
 */
export function planRm22TemplateInteriors(
  slots: Rm22SlotState,
): Rm22InteriorPlanItem[] {
  const product = rm22ProductById(slots.productId);
  const captions = photoCaptionCount(slots);
  const items: Rm22InteriorPlanItem[] = [
    {
      role: "product-sheet",
      fileName: "interior-product.jpg",
      assetHref: product.href,
      image: null,
      productId: product.id,
      caption: product.label,
    },
    {
      role: "intro",
      fileName: "interior-intro.jpg",
      assetHref: RM22_ASSETS.intro,
      image: slots.introImage,
      title: slots.introTitle,
      caption: slots.introCaption,
    },
  ];

  for (let index = 0; index < captions; index += 1) {
    items.push({
      role: "photo-caption",
      fileName: `interior-caption-${String(index + 1).padStart(2, "0")}.jpg`,
      assetHref: RM22_ASSETS.caption,
      image: slots.photoImages[index] ?? null,
      caption: slots.photoCaptions[index] ?? "",
    });
  }

  const intrinsicBody =
    slots.intrinsicBody.trim() ||
    defaultRm22IntrinsicBody({
      productLabel: product.label,
      lotTitle: slots.frontSubtitle,
      address: slots.frontTitle,
    });

  items.push(
    {
      role: "intrinsic",
      fileName: "interior-intrinsic.jpg",
      assetHref: RM22_ASSETS.intrinsic,
      image: slots.intrinsicImage,
      title: slots.intrinsicTitle,
      caption: slots.intrinsicCaption,
      body: intrinsicBody,
      signoff: slots.intrinsicSignoff || RM22_DEFAULT_COPY.intrinsicSignoff,
    },
    {
      role: "outro",
      fileName: "interior-outro.jpg",
      assetHref: RM22_ASSETS.outro,
      image: slots.outroImage,
      title: slots.outroTitle,
      caption: slots.outroCaption,
    },
  );

  return items;
}

export function rm22TemplateInteriorCount(slots?: Rm22SlotState): number {
  return planRm22TemplateInteriors(slots ?? createRm22SlotState()).length;
}

/**
 * Role for a 1-based interior leaf. Intrinsic and outro are always the last two
 * interiors — they are not tied to fixed book page numbers.
 */
export function rm22InteriorRole(
  interiorLeaf: number,
  captionCount = RM22_PHOTO_CAPTION_COUNT,
): Rm22InteriorRole | null {
  const total = 2 + captionCount + RM22_PROTECTED_ENDING_SPREADS;
  if (interiorLeaf < 1 || interiorLeaf > total) return null;
  if (interiorLeaf === 1) return "product-sheet";
  if (interiorLeaf === 2) return "intro";
  if (interiorLeaf === total) return "outro";
  if (interiorLeaf === total - 1) return "intrinsic";
  return "photo-caption";
}

export function rm22EndingRoles(plan: Rm22InteriorPlanItem[]): Rm22InteriorRole[] {
  return plan.slice(-RM22_PROTECTED_ENDING_SPREADS).map((item) => item.role);
}

export function productIdsInPlan(plan: Rm22InteriorPlanItem[]): Rm22ProductId[] {
  return plan
    .filter((item) => item.role === "product-sheet")
    .map((item) => item.productId)
    .filter((id): id is Rm22ProductId => Boolean(id));
}

export type Rm22SerializedInterior = {
  role: Rm22InteriorRole;
  imageUrl: string;
  title?: string;
  caption?: string;
  body?: string;
  signoff?: string;
  productId?: Rm22ProductId;
};

export type Rm22TemplatePayload = {
  version: 1;
  templateId: typeof RM22_TEMPLATE_ID;
  productId: Rm22ProductId;
  interiors: Rm22SerializedInterior[];
};

export type Rm22SlotImageUrls = {
  intro?: string | null;
  photos: Array<string | null>;
  intrinsic?: string | null;
  outro?: string | null;
};

export function serializeRm22TemplateInteriors(
  slots: Rm22SlotState,
  urls: Rm22SlotImageUrls,
): Rm22SerializedInterior[] {
  const plan = planRm22TemplateInteriors(slots);
  let photoIndex = 0;
  return plan.map((item) => {
    let imageUrl = "";
    if (item.role === "product-sheet") {
      imageUrl = item.assetHref;
    } else if (item.role === "intro") {
      imageUrl = rm22PhotoSlotUrl(urls.intro ?? slots.introImageUrl);
    } else if (item.role === "intrinsic") {
      imageUrl = rm22PhotoSlotUrl(urls.intrinsic ?? slots.intrinsicImageUrl);
    } else if (item.role === "outro") {
      imageUrl = rm22PhotoSlotUrl(urls.outro ?? slots.outroImageUrl);
    } else if (item.role === "photo-caption") {
      imageUrl = rm22PhotoSlotUrl(
        urls.photos[photoIndex] ?? slots.photoImageUrls[photoIndex],
      );
      photoIndex += 1;
    }
    return {
      role: item.role,
      imageUrl,
      title: item.title,
      caption: item.caption,
      body: item.body,
      signoff: item.signoff,
      productId: item.productId,
    };
  });
}

export function createRm22TemplatePayload(
  slots: Rm22SlotState,
  urls: Rm22SlotImageUrls,
): Rm22TemplatePayload {
  return {
    version: 1,
    templateId: RM22_TEMPLATE_ID,
    productId: slots.productId,
    interiors: serializeRm22TemplateInteriors(slots, urls),
  };
}

export function parseRm22TemplatePayload(
  raw: string | null | undefined,
): Rm22TemplatePayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (record.templateId !== RM22_TEMPLATE_ID || record.version !== 1) {
      return null;
    }
    const productId = isRm22ProductId(String(record.productId || ""))
      ? (record.productId as Rm22ProductId)
      : RM22_DEFAULT_PRODUCT_ID;
    const interiorsRaw = Array.isArray(record.interiors) ? record.interiors : [];
    const interiors: Rm22SerializedInterior[] = [];
    for (const item of interiorsRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const role = row.role;
      if (
        role !== "product-sheet" &&
        role !== "intro" &&
        role !== "photo-caption" &&
        role !== "intrinsic" &&
        role !== "outro"
      ) {
        continue;
      }
      const rawImageUrl = String(row.imageUrl || "").trim();
      const imageUrl =
        role === "product-sheet" ? rawImageUrl : rm22PhotoSlotUrl(rawImageUrl);
      if (role === "product-sheet" && !imageUrl) continue;
      interiors.push({
        role,
        imageUrl,
        title: typeof row.title === "string" ? row.title : undefined,
        caption: typeof row.caption === "string" ? row.caption : undefined,
        body: typeof row.body === "string" ? row.body : undefined,
        signoff: typeof row.signoff === "string" ? row.signoff : undefined,
        productId: isRm22ProductId(String(row.productId || ""))
          ? (row.productId as Rm22ProductId)
          : undefined,
      });
    }
    if (interiors.length === 0) return null;
    return { version: 1, templateId: RM22_TEMPLATE_ID, productId, interiors };
  } catch {
    return null;
  }
}

function templateCoverRow(
  imageUrl: string | null,
  half: "front" | "back",
  pageNumber: number,
): SelfServicePageRowContent {
  const isFront = half === "front";
  return {
    title: isFront ? "Front cover" : "Back cover",
    slug: isFront ? "front-cover" : "back-cover",
    page_number: pageNumber,
    sort_order: pageNumber,
    content: {
      pageRole: "cover",
      layout: "cover",
      title: "",
      body: "",
      heroImageUrl: imageUrl || undefined,
      exactPdfPage: true,
      coverSpreadHalf: half,
    },
  };
}

function templateSpreadPair(options: {
  startPage: number;
  slugPrefix: string;
  item: Rm22SerializedInterior;
}): SelfServicePageRowContent[] {
  const heading =
    options.item.role === "photo-caption"
      ? options.item.caption?.trim() || ""
      : options.item.title?.trim() || "";
  const caption =
    options.item.role === "photo-caption"
      ? options.item.caption?.trim() || ""
      : options.item.caption?.trim() || "";
  const shared = {
    pageRole: "property_content",
    layoutType: "spread",
    templateId: RM22_TEMPLATE_ID,
    templateRole: options.item.role,
    title: heading,
    body: caption && heading !== caption ? caption : "",
    spreadImageUrl: options.item.imageUrl,
    spreadMat: true,
    captionsEnabled: false,
    captionSkipped: true,
    productId: options.item.productId,
  };
  return [
    {
      title: heading || `Spread ${options.startPage}`,
      slug: `${options.slugPrefix}-left`,
      page_number: options.startPage,
      sort_order: options.startPage,
      content: {
        ...shared,
        layout: "centerfold_left",
        brochureLeaf: "left",
      },
    },
    {
      title: heading || `Spread ${options.startPage + 1}`,
      slug: `${options.slugPrefix}-right`,
      page_number: options.startPage + 1,
      sort_order: options.startPage + 1,
      content: {
        ...shared,
        layout: "centerfold_right",
        brochureLeaf: "right",
      },
    },
  ];
}

function templateIntrinsicPair(
  item: Rm22SerializedInterior,
  startPage: number,
): SelfServicePageRowContent[] {
  const title = item.title?.trim() || RM22_DEFAULT_COPY.intrinsicTitle;
  const body = item.body?.trim() || "";
  const caption = item.caption?.trim() || "";
  const signoff = item.signoff?.trim() || RM22_DEFAULT_COPY.intrinsicSignoff;
  return [
    {
      title,
      slug: "intrinsic-left",
      page_number: startPage,
      sort_order: startPage,
      content: {
        pageRole: "property_content",
        layout: "split_copy_left",
        layoutType: "spread",
        templateId: RM22_TEMPLATE_ID,
        templateRole: "intrinsic",
        title: caption,
        body: "",
        heroImageUrl: item.imageUrl,
        captionsEnabled: false,
        brochureLeaf: "left",
      },
    },
    {
      title,
      slug: "intrinsic-right",
      page_number: startPage + 1,
      sort_order: startPage + 1,
      content: {
        pageRole: "property_content",
        layout: "split_copy_right",
        layoutType: "spread",
        templateId: RM22_TEMPLATE_ID,
        templateRole: "intrinsic",
        title,
        body,
        signoff,
        captionsEnabled: false,
        brochureLeaf: "right",
      },
    },
  ];
}

/**
 * Viewer/PDF page rows for an RM22 template book.
 * Image slots and text slots stay separate — interiors are not flattened.
 */
export function buildRm22TemplatePageRows(input: {
  coverImageUrl: string | null;
  backCoverImageUrl: string | null;
  interiors: Rm22SerializedInterior[];
}): SelfServicePageRowContent[] {
  const rows: SelfServicePageRowContent[] = [];
  const hasFront = Boolean(input.coverImageUrl?.trim());
  const hasBack = Boolean(input.backCoverImageUrl?.trim());
  if (hasFront) {
    rows.push(templateCoverRow(input.coverImageUrl, "front", 1));
  }

  let cursor = hasFront ? 2 : 1;
  let photoIndex = 0;
  for (const item of input.interiors) {
    if (item.role === "intrinsic") {
      rows.push(...templateIntrinsicPair(item, cursor));
      cursor += 2;
      continue;
    }
    const slugPrefix =
      item.role === "product-sheet"
        ? "product"
        : item.role === "intro"
          ? "intro"
          : item.role === "outro"
            ? "outro"
            : `caption-${String((photoIndex += 1)).padStart(2, "0")}`;
    rows.push(
      ...templateSpreadPair({
        startPage: cursor,
        slugPrefix,
        item,
      }),
    );
    cursor += 2;
  }

  if (hasBack) {
    rows.push(templateCoverRow(input.backCoverImageUrl, "back", cursor));
  }
  return rows;
}

export type Rm22SlotHydration = {
  productId: Rm22ProductId;
  frontImageUrl: string | null;
  frontTitle: string;
  frontSubtitle: string;
  frontPriceLine: string;
  frontTagline: string;
  backAgentImageUrl: string | null;
  agencyLogoUrl: string | null;
  backKicker: string;
  agentName: string;
  agentPhone: string;
  introTitle: string;
  introCaption: string;
  introImageUrl: string | null;
  photoCaptions: string[];
  photoImageUrls: Array<string | null>;
  intrinsicTitle: string;
  intrinsicCaption: string;
  intrinsicBody: string;
  intrinsicSignoff: string;
  intrinsicImageUrl: string | null;
  outroTitle: string;
  outroCaption: string;
  outroImageUrl: string | null;
};

function emptyRm22Hydration(
  extras?: {
    productId?: Rm22ProductId;
    agentName?: string | null;
    agentPhone?: string | null;
    agencyLogoUrl?: string | null;
  },
): Rm22SlotHydration {
  return {
    productId: extras?.productId ?? RM22_DEFAULT_PRODUCT_ID,
    frontImageUrl: null,
    frontTitle: "",
    frontSubtitle: "",
    frontPriceLine: "",
    frontTagline: "",
    backAgentImageUrl: null,
    agencyLogoUrl: extras?.agencyLogoUrl?.trim() || null,
    backKicker: "",
    agentName: extras?.agentName?.trim() || "",
    agentPhone: extras?.agentPhone?.trim() || "",
    introTitle: "",
    introCaption: "",
    introImageUrl: null,
    photoCaptions: Array.from({ length: RM22_PHOTO_CAPTION_COUNT }, () => ""),
    photoImageUrls: Array.from({ length: RM22_PHOTO_CAPTION_COUNT }, () => null),
    intrinsicTitle: "",
    intrinsicCaption: "",
    intrinsicBody: "",
    intrinsicSignoff: "",
    intrinsicImageUrl: null,
    outroTitle: "",
    outroCaption: "",
    outroImageUrl: null,
  };
}

/** Fill template slots from a saved Talisbook™'s covers and interior photos. */
export function rm22HydrationFromExistingMedia(input: {
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  interiors?: Array<string | null | undefined>;
  base?: Rm22SlotHydration | null;
}): Rm22SlotHydration {
  const hydration = input.base ? { ...input.base } : emptyRm22Hydration();
  hydration.frontImageUrl =
    rm22PhotoSlotUrl(input.frontImageUrl) || hydration.frontImageUrl;
  hydration.backAgentImageUrl =
    rm22PhotoSlotUrl(input.backImageUrl) || hydration.backAgentImageUrl;
  const interiors = (input.interiors ?? [])
    .map((url) => rm22PhotoSlotUrl(url) || null)
    .filter((url): url is string => Boolean(url));
  if (interiors.length === 0) return hydration;
  const hasSlotImages = Boolean(
    hydration.introImageUrl ||
      hydration.intrinsicImageUrl ||
      hydration.outroImageUrl ||
      hydration.photoImageUrls.some(Boolean),
  );
  if (hasSlotImages) return hydration;
  if (interiors.length === 1) {
    hydration.introImageUrl = interiors[0]!;
    return hydration;
  }
  if (interiors.length === 2) {
    hydration.introImageUrl = interiors[0]!;
    hydration.outroImageUrl = interiors[1]!;
    return hydration;
  }
  hydration.introImageUrl = interiors[0]!;
  const middle = interiors.slice(1, -2);
  hydration.photoImageUrls = [
    ...middle,
    ...Array.from(
      { length: Math.max(0, RM22_PHOTO_CAPTION_COUNT - middle.length) },
      () => null,
    ),
  ];
  hydration.photoCaptions = Array.from(
    { length: hydration.photoImageUrls.length },
    (_, index) => hydration.photoCaptions[index] ?? "",
  );
  hydration.intrinsicImageUrl = interiors[interiors.length - 2]!;
  hydration.outroImageUrl = interiors[interiors.length - 1]!;
  return hydration;
}

export function rm22HydrationFromSlots(slots: Rm22SlotState): Rm22SlotHydration {
  const photoCount = Math.max(
    RM22_PHOTO_CAPTION_COUNT,
    slots.photoImages.length,
    slots.photoImageUrls.length,
    slots.photoCaptions.length,
  );
  return {
    productId: slots.productId,
    frontImageUrl: slots.frontImageUrl,
    frontTitle: slots.frontTitle,
    frontSubtitle: slots.frontSubtitle,
    frontPriceLine: slots.frontPriceLine,
    frontTagline: slots.frontTagline,
    backAgentImageUrl: slots.backAgentImageUrl,
    agencyLogoUrl: slots.agencyLogoUrl,
    backKicker: slots.backKicker,
    agentName: slots.agentName,
    agentPhone: slots.agentPhone,
    introTitle: slots.introTitle,
    introCaption: slots.introCaption,
    introImageUrl: slots.introImageUrl,
    photoCaptions: Array.from(
      { length: photoCount },
      (_, index) => slots.photoCaptions[index] ?? "",
    ),
    photoImageUrls: Array.from(
      { length: photoCount },
      (_, index) => slots.photoImageUrls[index] ?? null,
    ),
    intrinsicTitle: slots.intrinsicTitle,
    intrinsicCaption: slots.intrinsicCaption,
    intrinsicBody: slots.intrinsicBody,
    intrinsicSignoff: slots.intrinsicSignoff,
    intrinsicImageUrl: slots.intrinsicImageUrl,
    outroTitle: slots.outroTitle,
    outroCaption: slots.outroCaption,
    outroImageUrl: slots.outroImageUrl,
  };
}

export function parseRm22SlotHydration(raw: unknown): Rm22SlotHydration | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const productId = isRm22ProductId(String(record.productId || ""))
    ? (record.productId as Rm22ProductId)
    : RM22_DEFAULT_PRODUCT_ID;
  const photoCaptions = Array.isArray(record.photoCaptions)
    ? record.photoCaptions.map((item) =>
        typeof item === "string" ? item : "",
      )
    : [];
  const photoImageUrls = Array.isArray(record.photoImageUrls)
    ? record.photoImageUrls.map((item) =>
        typeof item === "string" && item.trim() ? rm22PhotoSlotUrl(item) || null : null,
      )
    : [];
  const photoCount = Math.max(
    RM22_PHOTO_CAPTION_COUNT,
    photoCaptions.length,
    photoImageUrls.length,
  );
  return {
    productId,
    frontImageUrl:
      rm22PhotoSlotUrl(asTrimmedString(record.frontImageUrl)) || null,
    frontTitle: asTrimmedString(record.frontTitle),
    frontSubtitle: asTrimmedString(record.frontSubtitle),
    frontPriceLine: asTrimmedString(record.frontPriceLine),
    frontTagline: asTrimmedString(record.frontTagline),
    backAgentImageUrl:
      rm22PhotoSlotUrl(asTrimmedString(record.backAgentImageUrl)) || null,
    agencyLogoUrl:
      rm22PhotoSlotUrl(asTrimmedString(record.agencyLogoUrl)) || null,
    backKicker: asTrimmedString(record.backKicker),
    agentName: asTrimmedString(record.agentName),
    agentPhone: asTrimmedString(record.agentPhone),
    introTitle: asTrimmedString(record.introTitle),
    introCaption: asTrimmedString(record.introCaption),
    introImageUrl: rm22PhotoSlotUrl(asTrimmedString(record.introImageUrl)) || null,
    photoCaptions: Array.from(
      { length: photoCount },
      (_, index) => photoCaptions[index] ?? "",
    ),
    photoImageUrls: Array.from(
      { length: photoCount },
      (_, index) => photoImageUrls[index] ?? null,
    ),
    intrinsicTitle: asTrimmedString(record.intrinsicTitle),
    intrinsicCaption: asTrimmedString(record.intrinsicCaption),
    intrinsicBody: asTrimmedString(record.intrinsicBody),
    intrinsicSignoff: asTrimmedString(record.intrinsicSignoff),
    intrinsicImageUrl:
      rm22PhotoSlotUrl(asTrimmedString(record.intrinsicImageUrl)) || null,
    outroTitle: asTrimmedString(record.outroTitle),
    outroCaption: asTrimmedString(record.outroCaption),
    outroImageUrl: rm22PhotoSlotUrl(asTrimmedString(record.outroImageUrl)) || null,
  };
}

export function mergeRm22Hydration(
  stored: Rm22SlotHydration | null,
  fromPages: Rm22SlotHydration | null,
): Rm22SlotHydration | null {
  if (!stored) return fromPages;
  if (!fromPages) return stored;
  const photoCount = Math.max(
    stored.photoCaptions.length,
    stored.photoImageUrls.length,
    fromPages.photoCaptions.length,
    fromPages.photoImageUrls.length,
  );
  return {
    ...fromPages,
    ...stored,
    productId: stored.productId || fromPages.productId,
    frontImageUrl: stored.frontImageUrl || fromPages.frontImageUrl,
    backAgentImageUrl: stored.backAgentImageUrl || fromPages.backAgentImageUrl,
    agencyLogoUrl: stored.agencyLogoUrl || fromPages.agencyLogoUrl,
    introImageUrl: stored.introImageUrl || fromPages.introImageUrl,
    photoCaptions: Array.from(
      { length: photoCount },
      (_, index) => stored.photoCaptions[index] || fromPages.photoCaptions[index] || "",
    ),
    photoImageUrls: Array.from(
      { length: photoCount },
      (_, index) =>
        stored.photoImageUrls[index] || fromPages.photoImageUrls[index] || null,
    ),
    intrinsicImageUrl: stored.intrinsicImageUrl || fromPages.intrinsicImageUrl,
    outroImageUrl: stored.outroImageUrl || fromPages.outroImageUrl,
    intrinsicBody: stored.intrinsicBody || fromPages.intrinsicBody,
  };
}

export function rm22CoverCopyChanged(
  current: Rm22SlotState,
  initial: Rm22SlotHydration | null,
): boolean {
  if (!initial) return true;
  return (
    current.frontTitle.trim() !== initial.frontTitle.trim() ||
    current.frontSubtitle.trim() !== initial.frontSubtitle.trim() ||
    current.frontPriceLine.trim() !== initial.frontPriceLine.trim() ||
    current.frontTagline.trim() !== initial.frontTagline.trim() ||
    current.backKicker.trim() !== initial.backKicker.trim() ||
    current.agentName.trim() !== initial.agentName.trim() ||
    current.agentPhone.trim() !== initial.agentPhone.trim() ||
    Boolean(current.agencyLogo) ||
    (current.agencyLogoUrl || "") !== (initial.agencyLogoUrl || "")
  );
}

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pageImageUrl(content: Record<string, unknown>): string | null {
  const spread = rm22PhotoSlotUrl(asTrimmedString(content.spreadImageUrl));
  if (spread) return spread;
  const hero = rm22PhotoSlotUrl(asTrimmedString(content.heroImageUrl));
  return hero || null;
}

function pageTemplateRole(
  content: Record<string, unknown>,
): Rm22InteriorRole | null {
  const role = content.templateRole;
  if (
    role === "product-sheet" ||
    role === "intro" ||
    role === "photo-caption" ||
    role === "intrinsic" ||
    role === "outro"
  ) {
    return role;
  }
  return null;
}

/** Rebuild template slots from a saved Talisbook™ so admin can edit in-place. */
export function rm22HydrationFromPageContents(
  pages: Array<{ content?: unknown; page_number?: number }>,
  extras?: {
    agentName?: string | null;
    agentPhone?: string | null;
    address?: string | null;
    lotTitle?: string | null;
    lotWriteup?: string | null;
    priceLine?: string | null;
  },
): Rm22SlotHydration | null {
  const sorted = [...pages].sort(
    (a, b) => (a.page_number ?? 0) - (b.page_number ?? 0),
  );
  const hydration = emptyRm22Hydration({
    agentName: extras?.agentName,
    agentPhone: extras?.agentPhone,
  });
  const cover = rm22CoverBandFromOnboarding({
    address: extras?.address,
    lotTitle: extras?.lotTitle,
    lotWriteup: extras?.lotWriteup,
    priceLine: extras?.priceLine,
  });
  hydration.frontTitle = cover.frontTitle;
  hydration.frontSubtitle = cover.frontSubtitle;
  hydration.frontPriceLine = cover.frontPriceLine;
  hydration.frontTagline = cover.frontTagline;

  let sawTemplate = false;
  let photoIndex = 0;
  const untemplated: Array<{ url: string | null; title: string; caption: string }> = [];
  for (const page of sorted) {
    const content = contentRecord(page.content);
    const leaf = asTrimmedString(content.brochureLeaf);
    const pageRole = asTrimmedString(content.pageRole);
    const coverHalf = asTrimmedString(content.coverSpreadHalf);
    if (pageRole === "cover" || asTrimmedString(content.layout) === "cover") {
      const url =
        rm22PhotoSlotUrl(asTrimmedString(content.heroImageUrl)) ||
        pageImageUrl(content);
      if (coverHalf === "back" || (!hydration.backAgentImageUrl && hydration.frontImageUrl)) {
        hydration.backAgentImageUrl = hydration.backAgentImageUrl || url;
      } else {
        hydration.frontImageUrl = hydration.frontImageUrl || url;
      }
      continue;
    }
    const role = pageTemplateRole(content);
    if (!role) {
      if (leaf !== "right") {
        untemplated.push({
          url: pageImageUrl(content),
          title: asTrimmedString(content.title),
          caption:
            asTrimmedString(content.body) || asTrimmedString(content.caption),
        });
      }
      continue;
    }
    sawTemplate = true;
    if (role === "product-sheet") {
      if (isRm22ProductId(String(content.productId || ""))) {
        hydration.productId = content.productId as Rm22ProductId;
      }
      continue;
    }
    if (role === "intro" && leaf !== "right") {
      hydration.introTitle =
        asTrimmedString(content.title) || hydration.introTitle;
      hydration.introCaption =
        asTrimmedString(content.body) ||
        asTrimmedString(content.caption) ||
        hydration.introCaption;
      hydration.introImageUrl = pageImageUrl(content);
      continue;
    }
    if (role === "photo-caption" && leaf !== "right") {
      while (hydration.photoCaptions.length <= photoIndex) {
        hydration.photoCaptions.push("");
        hydration.photoImageUrls.push(null);
      }
      hydration.photoCaptions[photoIndex] =
        asTrimmedString(content.title) ||
        asTrimmedString(content.body) ||
        "";
      hydration.photoImageUrls[photoIndex] = pageImageUrl(content);
      photoIndex += 1;
      continue;
    }
    if (role === "intrinsic") {
      if (leaf !== "right") {
        hydration.intrinsicCaption =
          asTrimmedString(content.title) || hydration.intrinsicCaption;
        hydration.intrinsicImageUrl = pageImageUrl(content);
      } else {
        hydration.intrinsicTitle =
          asTrimmedString(content.title) || hydration.intrinsicTitle;
        hydration.intrinsicBody =
          asTrimmedString(content.body) || hydration.intrinsicBody;
        hydration.intrinsicSignoff =
          asTrimmedString(content.signoff) || hydration.intrinsicSignoff;
      }
      continue;
    }
    if (role === "outro" && leaf !== "right") {
      hydration.outroTitle =
        asTrimmedString(content.title) || hydration.outroTitle;
      hydration.outroCaption =
        asTrimmedString(content.body) || hydration.outroCaption;
      hydration.outroImageUrl = pageImageUrl(content);
    }
  }

  if (!sawTemplate) {
    if (
      !hydration.frontImageUrl &&
      !hydration.backAgentImageUrl &&
      untemplated.every((item) => !item.url)
    ) {
      return null;
    }
    const spreads = untemplated.filter((item) => item.url);
    if (spreads.length === 1) {
      hydration.introImageUrl = spreads[0]!.url;
      hydration.introTitle = spreads[0]!.title;
      hydration.introCaption = spreads[0]!.caption;
    } else if (spreads.length === 2) {
      hydration.introImageUrl = spreads[0]!.url;
      hydration.introTitle = spreads[0]!.title;
      hydration.introCaption = spreads[0]!.caption;
      hydration.outroImageUrl = spreads[1]!.url;
      hydration.outroTitle = spreads[1]!.title;
      hydration.outroCaption = spreads[1]!.caption;
    } else if (spreads.length >= 3) {
      hydration.introImageUrl = spreads[0]!.url;
      hydration.introTitle = spreads[0]!.title;
      hydration.introCaption = spreads[0]!.caption;
      const middle = spreads.slice(1, -2);
      hydration.photoCaptions = middle.map((item) => item.caption || item.title);
      hydration.photoImageUrls = middle.map((item) => item.url);
      while (hydration.photoCaptions.length < RM22_PHOTO_CAPTION_COUNT) {
        hydration.photoCaptions.push("");
        hydration.photoImageUrls.push(null);
      }
      hydration.intrinsicImageUrl = spreads[spreads.length - 2]!.url;
      hydration.intrinsicCaption = spreads[spreads.length - 2]!.caption;
      hydration.intrinsicTitle = spreads[spreads.length - 2]!.title;
      hydration.outroImageUrl = spreads[spreads.length - 1]!.url;
      hydration.outroTitle = spreads[spreads.length - 1]!.title;
      hydration.outroCaption = spreads[spreads.length - 1]!.caption;
    }
    return hydration;
  }
  return hydration;
}

export function applyRm22SlotHydration(
  base: Rm22SlotState,
  hydration: Rm22SlotHydration,
): Rm22SlotState {
  const photoCount = Math.max(
    RM22_PHOTO_CAPTION_COUNT,
    hydration.photoCaptions.length,
    hydration.photoImageUrls.length,
  );
  return {
    ...base,
    productId: hydration.productId,
    frontImage: null,
    frontImageUrl: hydration.frontImageUrl,
    frontTitle: hydration.frontTitle,
    frontSubtitle: hydration.frontSubtitle,
    frontPriceLine: hydration.frontPriceLine,
    frontTagline: hydration.frontTagline,
    backAgentImage: null,
    backAgentImageUrl: hydration.backAgentImageUrl,
    agencyLogo: base.agencyLogo,
    agencyLogoUrl: hydration.agencyLogoUrl || base.agencyLogoUrl,
    backKicker: hydration.backKicker,
    agentName: hydration.agentName || base.agentName,
    agentPhone: hydration.agentPhone || base.agentPhone,
    introTitle: hydration.introTitle,
    introCaption: hydration.introCaption,
    introImage: null,
    introImageUrl: hydration.introImageUrl,
    photoImages: Array.from({ length: photoCount }, () => null),
    photoImageUrls: Array.from(
      { length: photoCount },
      (_, index) => hydration.photoImageUrls[index] ?? null,
    ),
    photoCaptions: Array.from(
      { length: photoCount },
      (_, index) => hydration.photoCaptions[index] ?? "",
    ),
    intrinsicTitle: hydration.intrinsicTitle,
    intrinsicCaption: hydration.intrinsicCaption,
    intrinsicBody: hydration.intrinsicBody,
    intrinsicSignoff: hydration.intrinsicSignoff,
    intrinsicImage: null,
    intrinsicImageUrl: hydration.intrinsicImageUrl,
    outroTitle: hydration.outroTitle,
    outroCaption: hydration.outroCaption,
    outroImage: null,
    outroImageUrl: hydration.outroImageUrl,
  };
}
