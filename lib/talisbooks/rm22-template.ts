/** RM22 Talisbook™ self-serve template — one product sheet + editable stub slots. */

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

export const RM22_ASSETS = {
  front: `${RM22_TEMPLATE_ROOT}/overlays/front.jpg`,
  agent: `${RM22_TEMPLATE_ROOT}/overlays/agent.jpg`,
  intro: `${RM22_TEMPLATE_ROOT}/interiors/intro.jpg`,
  caption: `${RM22_TEMPLATE_ROOT}/interiors/caption.jpg`,
  intrinsic: `${RM22_TEMPLATE_ROOT}/interiors/intrinsic.jpg`,
  outro: `${RM22_TEMPLATE_ROOT}/interiors/outro.jpg`,
} as const;

export function isRm22ProductId(value: string): value is Rm22ProductId {
  return RM22_PRODUCTS.some((product) => product.id === value);
}

export function rm22ProductById(id: Rm22ProductId | string | null | undefined) {
  const match = RM22_PRODUCTS.find((product) => product.id === id);
  return match ?? RM22_PRODUCTS[0];
}

export const RM22_DEFAULT_COPY = {
  frontTitle: "Property",
  frontSubtitle: "Primary Attribute",
  frontPriceLine: "From [ Price ] per acre.",
  frontTagline: "Available with or without Tiny Home, turn key optional.",
  backKicker: "Your Marketing Partner...",
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
  frontTitle: string;
  frontSubtitle: string;
  frontPriceLine: string;
  frontTagline: string;
  backAgentImage: File | null;
  backKicker: string;
  agentName: string;
  agentPhone: string;
  introImage: File | null;
  introTitle: string;
  introCaption: string;
  photoImages: Array<File | null>;
  photoCaptions: string[];
  intrinsicImage: File | null;
  intrinsicTitle: string;
  intrinsicCaption: string;
  intrinsicBody: string;
  intrinsicSignoff: string;
  outroImage: File | null;
  outroTitle: string;
  outroCaption: string;
};

export type Rm22CoverBandInput = {
  title?: string | null;
  address?: string | null;
  priceLine?: string | null;
  tagline?: string | null;
};

/** Property band on the front cover — fill address/price from onboarding when known. */
export function rm22CoverBandFromOnboarding(input?: Rm22CoverBandInput): {
  frontTitle: string;
  frontSubtitle: string;
  frontPriceLine: string;
  frontTagline: string;
} {
  return {
    frontTitle: input?.title?.trim() || RM22_DEFAULT_COPY.frontTitle,
    frontSubtitle: input?.address?.trim() || RM22_DEFAULT_COPY.frontSubtitle,
    frontPriceLine: input?.priceLine?.trim() || RM22_DEFAULT_COPY.frontPriceLine,
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
  const lot = input.lotTitle?.trim() && input.lotTitle.trim() !== RM22_DEFAULT_COPY.frontTitle
    ? input.lotTitle.trim()
    : "this lot";
  const where = input.address?.trim() && input.address.trim() !== RM22_DEFAULT_COPY.frontSubtitle
    ? input.address.trim()
    : "";
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
  frontTitle?: string;
  address?: string;
  priceLine?: string;
  tagline?: string;
}): Rm22SlotState {
  const agentName = input?.agentName?.trim() || RM22_DEFAULT_COPY.agentName;
  const agentPhone = input?.agentPhone?.trim() || RM22_DEFAULT_COPY.agentPhone;
  const cover = rm22CoverBandFromOnboarding({
    title: input?.frontTitle,
    address: input?.address,
    priceLine: input?.priceLine,
    tagline: input?.tagline,
  });
  return {
    productId: input?.productId ?? RM22_DEFAULT_PRODUCT_ID,
    frontImage: null,
    frontTitle: cover.frontTitle,
    frontSubtitle: cover.frontSubtitle,
    frontPriceLine: cover.frontPriceLine,
    frontTagline: cover.frontTagline,
    backAgentImage: null,
    backKicker: RM22_DEFAULT_COPY.backKicker,
    agentName,
    agentPhone,
    introImage: null,
    introTitle: RM22_DEFAULT_COPY.introTitle,
    introCaption: RM22_DEFAULT_COPY.introCaption,
    photoImages: Array.from({ length: RM22_PHOTO_CAPTION_COUNT }, () => null),
    photoCaptions: [...RM22_DEFAULT_COPY.photoCaptions],
    intrinsicImage: null,
    intrinsicTitle: RM22_DEFAULT_COPY.intrinsicTitle,
    intrinsicCaption: RM22_DEFAULT_COPY.intrinsicCaption,
    intrinsicBody: RM22_DEFAULT_COPY.intrinsicBody,
    intrinsicSignoff: RM22_DEFAULT_COPY.intrinsicSignoff,
    outroImage: null,
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
      lotTitle: slots.frontTitle,
      address: slots.frontSubtitle,
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
