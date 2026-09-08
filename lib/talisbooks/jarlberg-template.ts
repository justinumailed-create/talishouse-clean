/** Jarlberg Nature Centre Talisbook™ template — wrap cover + 11 landscape interiors. */

export const JARLBERG_TEMPLATE_ROOT = "/talisbooks/templates/jarlberg";
export const JARLBERG_WRAP_HREF = `${JARLBERG_TEMPLATE_ROOT}/wrap.jpg`;
export const JARLBERG_INTERIOR_COUNT = 11;
export const JARLBERG_PAGE_WIDTH = 1920;
export const JARLBERG_PAGE_HEIGHT = 1080;

export function jarlbergInteriorHref(page: number): string {
  const n = String(page).padStart(2, "0");
  return `${JARLBERG_TEMPLATE_ROOT}/interiors/${n}.jpg`;
}

export const JARLBERG_ASSETS = {
  wrap: JARLBERG_WRAP_HREF,
  front: `${JARLBERG_TEMPLATE_ROOT}/overlays/front.jpg`,
  agent: `${JARLBERG_TEMPLATE_ROOT}/overlays/agent.jpg`,
  mapDefault: `${JARLBERG_TEMPLATE_ROOT}/overlays/map-default.jpg`,
  dome: `${JARLBERG_TEMPLATE_ROOT}/overlays/dome.png`,
  investor: `${JARLBERG_TEMPLATE_ROOT}/overlays/investor.jpg`,
  neighbours: [
    `${JARLBERG_TEMPLATE_ROOT}/overlays/n1.jpg`,
    `${JARLBERG_TEMPLATE_ROOT}/overlays/n2.jpg`,
    `${JARLBERG_TEMPLATE_ROOT}/overlays/n3.jpg`,
    `${JARLBERG_TEMPLATE_ROOT}/overlays/n4.jpg`,
  ] as const,
} as const;

export const JARLBERG_DOME_PLACE = {
  x: 0,
  y: 0.4595,
  w: 0.42,
  h: 0.5405,
} as const;

export const JARLBERG_LIME = "#c6de00";

export const JARLBERG_DEFAULT_COPY = {
  broughtBy: "Brought to you by:",
  agentName: "Ralf P. Meyer",
  agentPhone: "+1-902-317-2223",
  frontTitle: "Welcome to the\nJarlberg Nature\nCentre",
  welcomeTitle: "Welcome…",
  photoCaptions: [
    "The entire Jarlberg Nature Centre and surrounding areas.",
    "The Lake, affectionately known as Loch Arylron in honour of the Jarlberg Nature Centre’s Founder among the centre’s staff.",
    "“Loch Arylron” near where the first of the Jarlberg Nature Centre’s dome villages will be located.",
    "In that same area: mountain views and massive oak, maple, birch and pine trees are common throughout the Jarlberg Nature Centre.",
    "The Jarlberg Nature Centre has many geological features that put this area’s moraine-based origins on full display.",
    "In all his years of ownership the Founder has cut an extensive network of trails throughout the Nature Centre.",
    "It would take days to walk them all, especially if the objective was to become aware of how this land came to be.",
  ] as const,
  neighboursTitle: "The Neighbours",
  investorTitle: "The Investor Page",
  investorBody: `The Jarlberg Nature Centre was founded by [ Name to be added later ], who owns the land upon which the business is located. He also contributed the seed capital to kick-start this unique and long overdue project.

As a younger man he sang opera on Broadway and produced shows on premier stages in Europe. Here on Cape Breton Island, Nova Scotia, Canada, he volunteers his time, which means the Jarlberg Nature Centre will put on two to four high end productions that might attract personalities from his former circles.

He envisions Jarlberg to be a four season escape, set it up as such by partnering with a local company that provides high-end tiny home and dome structures at reasonable prices for DIY builders - the Founder is an accomplished DIY builder.

He has chosen domes, because they suit the landscape, are insulated to R36 for four season usability, and, at 305 sq.ft. of standard floor space, they are just slightly larger than typical hotel or motel suites. Of course, they do include efficiency kitchens and luxury baths suitable for two.

Of particular interest to Jarlberg Nature Centre patrons and investors will be a future water bottling plant. The Jarlberg mountain has a spring, and a waterfall, whose spring water is as pure and cold as glacier ice - perfect for bottling. Once approved, this opportunity is reserved for existing Jarlberg dome owners and Nature Centre investors as a long-term continuous revenue source.

Please call Ralf at +1-902-317-2223 to express an interest.`,
  investorSignoff: "The Jarlberg Team",
  partingTitle: "The Parting Shot…!",
  partingCaption: "Meet you at the top…!",
} as const;

/** Interior 1-based page roles in the generated book (after wrap covers). */
export type JarlbergInteriorRole =
  | "map-dome"
  | "photo-caption"
  | "four-up"
  | "split-copy"
  | "parting";

export function jarlbergInteriorRole(page: number): JarlbergInteriorRole {
  if (page === 1) return "map-dome";
  if (page === 9) return "four-up";
  if (page === 10) return "split-copy";
  if (page === 11) return "parting";
  return "photo-caption";
}

export type JarlbergPin = {
  latitude: number;
  longitude: number;
};

export type JarlbergSlotState = {
  frontImage: File | null;
  frontTitle: string;
  backAgentImage: File | null;
  broughtBy: string;
  agentName: string;
  agentPhone: string;
  welcomeTitle: string;
  photoImages: Array<File | null>;
  photoCaptions: string[];
  neighbourImages: Array<File | null>;
  neighboursTitle: string;
  investorImage: File | null;
  investorTitle: string;
  investorBody: string;
  investorSignoff: string;
  partingImage: File | null;
  partingTitle: string;
  partingCaption: string;
};

export function createJarlbergSlotState(input?: {
  agentName?: string;
  agentPhone?: string;
}): JarlbergSlotState {
  const agentName = input?.agentName?.trim() || JARLBERG_DEFAULT_COPY.agentName;
  const agentPhone = input?.agentPhone?.trim() || JARLBERG_DEFAULT_COPY.agentPhone;
  return {
    frontImage: null,
    frontTitle: JARLBERG_DEFAULT_COPY.frontTitle,
    backAgentImage: null,
    broughtBy: JARLBERG_DEFAULT_COPY.broughtBy,
    agentName,
    agentPhone,
    welcomeTitle: JARLBERG_DEFAULT_COPY.welcomeTitle,
    photoImages: Array.from({ length: 7 }, () => null),
    photoCaptions: [...JARLBERG_DEFAULT_COPY.photoCaptions],
    neighbourImages: [null, null, null, null],
    neighboursTitle: JARLBERG_DEFAULT_COPY.neighboursTitle,
    investorImage: null,
    investorTitle: JARLBERG_DEFAULT_COPY.investorTitle,
    investorBody: JARLBERG_DEFAULT_COPY.investorBody.replace(
      "+1-902-317-2223",
      agentPhone,
    ),
    investorSignoff: JARLBERG_DEFAULT_COPY.investorSignoff,
    partingImage: null,
    partingTitle: JARLBERG_DEFAULT_COPY.partingTitle,
    partingCaption: JARLBERG_DEFAULT_COPY.partingCaption,
  };
}
