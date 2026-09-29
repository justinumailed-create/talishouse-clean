/** TalisU™ marketing + Sea-Cans content under /talisu */

export const TALISU_BASE_PATH = "/talisu";

export const TALISU_SITE_URL = "https://www.talispros.com";

export type TalisUNavItem = {
  href: string;
  label: string;
  section?: "primary" | "seacans";
};

export const TALISU_PRIMARY_NAV: TalisUNavItem[] = [
  { href: "/talisu", label: "Welcome", section: "primary" },
  { href: "/talisu/mkts", label: "Markets", section: "primary" },
  { href: "/catalogue/bookshelf", label: "E-Book", section: "primary" },
  { href: "/talisu/au", label: "Audio", section: "primary" },
  { href: "/talisu/reg", label: "Register", section: "primary" },
  { href: "/talispros/demo-mapsite", label: "Demo", section: "primary" },
  { href: "/catalogue", label: "Catalogue", section: "primary" },
  { href: "/talisu/engage", label: "Engage", section: "primary" },
];

export const TALISU_SEACANS_NAV: TalisUNavItem[] = [
  { href: "/talisu/bo", label: "Business Office", section: "seacans" },
  { href: "/talisu/sh", label: "Show Home", section: "seacans" },
  { href: "/talisu/cu", label: "Contact", section: "seacans" },
];

export const TALISU_WELCOME = {
  eyebrow: "Industry Adjacent Fulfilment Options 101",
  heading: "Transaction Structures we support",
  structures: [
    {
      title: "Conventional",
      body: "We globally connect buyers or buyer's agents with sellers or seller's agents to complete transactions the old-fashioned way: find each other, have offers accepted and close them to earn percentage-based commissions. We do not charge referrals.",
    },
    {
      title: "SPLITS",
      body: "We help formalize LTO terms (Lease To Own) by introducing 'Simple Product Lead & Input Tracking System' options: downpayment plus instalment payments secured by lawyer-generated agreements until title changes hands.",
    },
    {
      title: "Fractionalization",
      body: "A single title gives multiple owners clearly defined usage rights and benefits involving a legal layer above the actual property or asset type. Best described as a business model that separates the dirt from what is done on or with it.",
    },
    {
      title: "Tokenization",
      body: "Tokenization converts physical real estate's ownership rights into digital tokens on a blockchain that allows investors to buy fractional shares of the asset and trade them with lower fees and higher liquidity. A great way to raise capital.",
    },
  ],
  aishaTitle: "Click PLAY to listen to a Summary…!",
  aishaArtist: "Aisha",
  aishaSrc: "/talisu/Aisha.mp3",
} as const;

export const TALISU_MARKETS_COPY = {
  title: "Markets served",
  body: "Select the PIN nearest you to claim a market of 50 miles (80 kilometres) around a centre point as semi-exclusive territory. Semi-exclusive means no other markets will be granted within that circle, but neighbouring markets will not be prevented from pinning Listings for which they have written and verified listing documentation.",
  claimHref: "/talispros/markets/claim-a-market",
} as const;

export const TALISU_AUDIO = {
  title: "Audio Deep Dive",
  subtitle: "A Deep Dive on Asset Fractionalization and Tokenization…",
  /** Hosted on live talisu.com until the ~40MB file is placed on CDN/deploy. */
  deepDiveRemoteSrc: "https://talisu.com/resources/Deep-Dive.mp3",
  deepDiveLocalSrc: "/talisu/Deep-Dive.mp3",
  playHint: "Press PLAY, or scroll to the bottom to print and read.",
} as const;

export const TALISU_REGISTER = {
  title: "Register Account",
  partnerHeading: "Your Marketing Partner",
  partnerName: "Aisha C. — Team Leader",
  partnerIntro:
    "My team and I help grow your real estate adjacent marketing initiatives along four broad parameters:",
  bullets: [
    {
      label: "Mapsites™",
      text: "we provide dedicated map-based platforms that can serve as referral and co-promotion network tools when publishing special purpose or user generated contents. Please note: contents must be non-political and in good taste by generally accepted standards at our sole discretion. Contents deemed otherwise will be switched \"blind\" by our AI bots, immediately and without warning. Resubmissions are permissible.",
    },
    {
      label: "TEB",
      text: "we manage your online bookshelf to highlight qualifying listings (QL) by actively promoting pinned digital publications globally. Of course, QL are those that pay you enough and have enough term to improve performance metrics over time.",
    },
    {
      label: "TVA",
      text: "we analyze qualifying listings to establish suitability for investor classes that seek advanced transaction structures, including SPLITS, Fractionalization and Tokenization. Since all are often incompatible with exposure on traditional industry platforms they require Mapsites™ for promotional purposes.",
    },
    {
      label: "TTV",
      text: "we provide an in-house online TV Station by giving it its digital home. Additionally, we provide AI video production and assist in weekly channel programming to include virtual walk throughs, digital open houses and, of course, value added proposals.",
    },
  ],
  closing: "Please add us as a resource…!",
  samcartUrl: "https://talispros.mysamcart.com/checkout/register",
} as const;

export const TALISU_ENGAGE = {
  title: "Engage the Team",
  headline: "Send a Down Payment to engage Webster and his Design Team",
  partnerHeading: "Your Product Partner",
  partnerName: "Webster M. — Team Leader",
  partnerIntro:
    "My team and I help grow you diversify horizontally by offering space along with property of businesses:",
  bullets: [
    {
      label: "GH",
      text: "an abbreviation for Glasshouse, GH are 8x20 or 10x20 spaces with one, two or three sides glass, finished inside but not furnished. Kitchen and Bathroom facilities are options.",
    },
    {
      label: "TH",
      text: "an abbreviation for Talishouse, TH are 20x20 or 20x40 folding structures with two or three bedrooms and one or two bathrooms. Kitchen, dining and living rooms are open concept, or further divided to facilitate offices or business space. TH are optionally mobile, thus negating the need for Building Permits in many North American jurisdictions.",
    },
    {
      label: "TT",
      text: "an abbreviation for Talistown, TT are many TH on one property, or serving the same purpose under SPLITS or Fractionalized ownership. TT can be scaled to make a million dollars per year.",
    },
    {
      label: "TD",
      text: "an abbreviation for Talisdome, TD are the quintessential guest house, in-law suite, home office or even short term rental. Their impermanent nature negates the need for Building Permits in many North American jurisdictions.",
    },
  ],
  closing:
    "Send us any amount up to a maximum of $10,000 as a down payment, and to start the customization process for your object or project.",
  samcartUrl: "https://talispros.mysamcart.com/checkout/custom",
} as const;

export type SeaCanSku = {
  slug: string;
  code: string;
  name: string;
  dimensions: string;
  blurb: string;
  samcartUrl: string;
};

export const SEA_CAN_SKUS: SeaCanSku[] = [
  {
    slug: "tsc20",
    code: "TSC20",
    name: "TalisU Sea-Cans 20 ft.",
    dimensions: "20' × 8' × 8'6\"",
    blurb: "Practical half length versatility.",
    samcartUrl: "https://talispros.mysamcart.com/checkout/tusc20s",
  },
  {
    slug: "tsc40",
    code: "TSC40",
    name: "TalisU Sea-Cans 40 ft.",
    dimensions: "40' × 8' × 8'6\"",
    blurb: "Maximum full length versatility.",
    samcartUrl: "https://talispros.mysamcart.com/checkout/tusc40s",
  },
  {
    slug: "hc40",
    code: "HC40",
    name: "TalisU High-Cube 40 ft.",
    dimensions: "40' × 8' × 9'6\"",
    blurb: "Best for home and cottage sections.",
    samcartUrl: "https://talispros.mysamcart.com/checkout/tusc40hc",
  },
  {
    slug: "sd20",
    code: "SD20",
    name: "TalisU Side-Doors 20 ft.",
    dimensions: "2 × 10' × 8' × 8'6\"",
    blurb: "Best for commercial applications.",
    samcartUrl: "https://talispros.mysamcart.com/checkout/tusc20sd",
  },
  {
    slug: "sd40",
    code: "SD40",
    name: "TalisU Side-Doors 40 ft.",
    dimensions: "4 × 10' × 8' × 8'6\"",
    blurb: "Best for commercial applications.",
    samcartUrl: "https://talispros.mysamcart.com/checkout/tusc40sd",
  },
];

export const SEA_CAN_NOTES = [
  "All prices plus tax and transport from our corporate storage site.",
  "Lease to own may be available, OAC (downpayment required).",
  "Direct shipment and wholesale discounts available.",
] as const;

export const SEA_CAN_BO = {
  title: "Business Office",
  interestHeading: "Express an Interest",
  interestSubheading: "to qualify for our 'Friends of…' discount",
  productLabel: "Product",
} as const;

export const SEA_CAN_SHOW_HOME = {
  title: "Show Home",
  heading: "Visit the Building Site by appointment only",
  phoneDisplay: "+1-902-578-0167",
  phoneHref: "tel:+19025780167",
  contactName: "Jonathan",
  /** Approximate NS building-site pin — refine when exact lat/lng are confirmed. */
  latitude: 46.1368,
  longitude: -60.1942,
  pinLabel: "TalisU Sea-Cans Show Home — appointment only",
} as const;

export const SEA_CAN_CONTACT = {
  title: "Contact Us",
  heading: "Contact Us",
} as const;

export const SEA_CAN_TAGLINE =
  "We facilitate DIY Container Homes using TalisU Sea-Cans and our tried and proven approach that typically stays under $100K.";

export function getSeaCanSku(slug: string): SeaCanSku | undefined {
  return SEA_CAN_SKUS.find((s) => s.slug === slug);
}
