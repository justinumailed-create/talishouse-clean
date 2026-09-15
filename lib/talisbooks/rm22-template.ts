/** RM22 Talisbook™ self-serve template — one product sheet + editable stub slots. */

export const RM22_TEMPLATE_ROOT = "/talisbooks/templates/rm22";
export const RM22_PAGE_WIDTH = 1920;
export const RM22_PAGE_HEIGHT = 1080;
export const RM22_COVER_WIDTH = 1080;
export const RM22_COVER_HEIGHT = 1920;
export const RM22_PHOTO_CAPTION_COUNT = 6;

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

export function createRm22SlotState(input?: {
  agentName?: string;
  agentPhone?: string;
  productId?: Rm22ProductId;
}): Rm22SlotState {
  const agentName = input?.agentName?.trim() || RM22_DEFAULT_COPY.agentName;
  const agentPhone = input?.agentPhone?.trim() || RM22_DEFAULT_COPY.agentPhone;
  return {
    productId: input?.productId ?? RM22_DEFAULT_PRODUCT_ID,
    frontImage: null,
    frontTitle: RM22_DEFAULT_COPY.frontTitle,
    frontSubtitle: RM22_DEFAULT_COPY.frontSubtitle,
    frontPriceLine: RM22_DEFAULT_COPY.frontPriceLine,
    frontTagline: RM22_DEFAULT_COPY.frontTagline,
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

/**
 * Ordered interior leaves for the self-serve RM22 book.
 * The chosen product sheet is always first; the other two products are omitted.
 */
export function planRm22TemplateInteriors(
  slots: Rm22SlotState,
): Rm22InteriorPlanItem[] {
  const product = rm22ProductById(slots.productId);
  const items: Rm22InteriorPlanItem[] = [
    {
      role: "product-sheet",
      fileName: "interior-01-product.jpg",
      assetHref: product.href,
      image: null,
      productId: product.id,
      caption: product.label,
    },
    {
      role: "intro",
      fileName: "interior-02-intro.jpg",
      assetHref: RM22_ASSETS.intro,
      image: slots.introImage,
      title: slots.introTitle,
      caption: slots.introCaption,
    },
  ];

  for (let index = 0; index < RM22_PHOTO_CAPTION_COUNT; index += 1) {
    const page = index + 3;
    items.push({
      role: "photo-caption",
      fileName: `interior-${String(page).padStart(2, "0")}-caption.jpg`,
      assetHref: RM22_ASSETS.caption,
      image: slots.photoImages[index] ?? null,
      caption: slots.photoCaptions[index] ?? "",
    });
  }

  items.push(
    {
      role: "intrinsic",
      fileName: "interior-09-intrinsic.jpg",
      assetHref: RM22_ASSETS.intrinsic,
      image: slots.intrinsicImage,
      title: slots.intrinsicTitle,
      caption: slots.intrinsicCaption,
      body: slots.intrinsicBody,
      signoff: slots.intrinsicSignoff,
    },
    {
      role: "outro",
      fileName: "interior-10-outro.jpg",
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

export function rm22InteriorRole(page: number): Rm22InteriorRole | null {
  if (page === 1) return "product-sheet";
  if (page === 2) return "intro";
  if (page >= 3 && page <= 8) return "photo-caption";
  if (page === 9) return "intrinsic";
  if (page === 10) return "outro";
  return null;
}

export function productIdsInPlan(plan: Rm22InteriorPlanItem[]): Rm22ProductId[] {
  return plan
    .filter((item) => item.role === "product-sheet")
    .map((item) => item.productId)
    .filter((id): id is Rm22ProductId => Boolean(id));
}
