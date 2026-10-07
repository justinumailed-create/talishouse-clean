/** TalisU™ marketing content under /talisu. Sea-Can SKUs stay in source but are not routed. */

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
  { href: "/talisu/sh", label: "Show Home", section: "seacans" },
  { href: "/talisu/cu", label: "Contact", section: "seacans" },
];

export const TALISU_WELCOME = {
  eyebrow: "Industry Adjacent Fulfilment Options",
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

/** FAQ item on /talisu — answer may be one string or several paragraphs, with optional bullets. */
export type TalisUFaqItem = {
  question: string;
  /** One or more answer paragraphs (string = single paragraph). */
  answer: string | readonly string[];
  /** Optional bullet list shown after the answer paragraph(s). */
  bullets?: readonly string[];
};

/** FAQ on /talisu — TalisU™ PMC Q&A (navbar FAQ → /talisu#faq). */
export const TALISU_FAQ: {
  title: string;
  items: readonly TalisUFaqItem[];
} = {
  title: "Frequently Asked Questions",
  items: [
    {
      question: "What is a Mapsite?",
      answer:
        "It is a map-based online navigation system that can be deployed industry adjacent and adds flexibility to how you promote major purchase products (those that typically exceed $10,000 per unit and are immobile, roll, float or fly).",
    },
    {
      question: "What does Talis“U” mean?",
      answer:
        "The “U” represents a play on words: “University” — we educate registrants to enlarge their marketing comfort zones and empower them to get their platforms out there, quickly and competently.",
    },
    {
      question: "What is the meaning of PMC?",
      answer:
        "Promote - Manage - Cooperate. Mapsites contain pins whose flags reveal URL, MLS®, TEB and TTV links for every pin:",
      bullets: [
        "URL: a means to advance narratives and shape external communication.",
        "MLS®: a link specifically for real estate professionals to bypass distractions en route to specific listings.",
        "TEB: Talis eBooks / Talisbooks™ are digital lead magnets and authority-building tools that attract clients and stand out in competitive markets.",
        "TTV: TalisTV™ serves to gain control over brand narratives, eliminate advertising dependencies and inspire deep audience engagement.",
      ],
    },
    {
      question: "What are Talispros™?",
      answer:
        "TalisU™ “graduates” who use Mapsites to visually chart, track, and manage the infrastructure of complex referral and/or co-promotion networks.",
    },
    {
      question: "How can Mapsites increase revenues for Talispros™?",
      answer: [
        "By setting up virtual monopolies that establish service floors.",
        "Example: an average service fee may be “X”, and an average term length may be “Y”, locally. How often would those averages be challenged when competing for clients the traditional way?",
        "Virtual monopolies with clearly defined up-side benefits may well introduce an argument that extra reward and/or extra term are warranted.",
      ],
    },
    {
      question: "How much to register an account?",
      answer: [
        "Registration for Root, FSBO and Adpro Accounts is $998.50 annually to establish the account, and $98.50 monthly to maintain it.",
        "Registration for Derivative Accounts, which use Root Account Mapsites, is $198.50 annually to establish the account, and $98.50 monthly to maintain it.",
        "Additional global marketing pins are $7 per week (a dollar a day, weekly commitment) for Derivative Account Holders.",
      ],
    },
    {
      question: "When do registration fees become due?",
      answer: "After approval of your market application.",
    },
    {
      question: "How do I submit a market application?",
      answer: "Please follow this sequence on Talispros.com:",
      bullets: [
        "Select “System Demo”.",
        "Choose the PIN closest to your home point.",
        "Select “Next Step” and build a demo eBook.",
        "Fill out the form: First initials of your first and last name generate half of your FAST Code™ (Free Access, Standard Tracking). The other half is a number between 01 and 99 to make you unique within our system. Your Street Address positions your Home PIN on your sample Mapsite. The sample Mapsite tells us if there are conflicts with other home markets.",
        "Select “Continue to Demo eBook”.",
        "Your Mapsite builds and a flag opens.",
        "You can claim your market by registering under URL and open TEB and TTV links.",
        "MLS® only applies to Licensed Real Estate Professionals registered through Root Account Holders.",
      ],
    },
    {
      question: "For how long are market approvals valid?",
      answer: [
        "Until someone else gets approved and registers. That time period might be hours or days, but it is unlikely to be weeks or months: our automated placement system will prioritize markets where there already has been interest, and your demo obviously triggered that interest condition.",
      ],
    },
    {
      question: "How much are referral fees for successful sales?",
      answer:
        "We are an advertising and marketing business. We do not charge referral fees.",
    },
    {
      question: "How long is the account commitment?",
      answer:
        "Simply stop paying service fees to stop services and avoid future obligations.",
    },
    {
      question: "Can I operate out of a home office?",
      answer:
        "Yes, provided the car you designate identifies you as Talispro with email address and cell number clearly visible on doors or box and hatch, trunk or tailgate.",
    },
    {
      question: "Do I have to work on the business myself?",
      answer:
        "No, providing you work with someone who is legally indistinguishable from you and we have the appropriate paperwork on file (i.e.: a spouse or adult child, etc.).",
    },
    {
      question: "How much money can I expect to make per year?",
      answer:
        "We cannot make representations regarding how much business you might do. There are too many factors that differ from person to person and from market to market.",
    },
    {
      question: "Will I receive training before I launch?",
      answer:
        "Yes. Our training program is very comprehensive and not limited in time or duration. By the time you are done you will have made your first sale and you are on your way to a better future.",
    },
  ],
};

export const TALISU_MARKETS_COPY = {
  title: "Markets served",
  body: "Select the PIN nearest you to claim a market of 50 miles (80 kilometres) around a centre point as semi-exclusive territory. Semi-exclusive means no other markets will be granted within that circle, but neighbouring markets will not be prevented from pinning Listings for which they have written and verified listing documentation.",
  /** Demo path — builds a Demo Mapsite (301/redirect via /talisu/demo). */
  claimHref: "/talisu/demo",
} as const;

export const TALISU_AUDIO = {
  title: "Audio",
  /** Short ~1 min welcome clip — autoplays when /talisu/au opens. */
  autoplaySrc: "/talisu/Aisha.mp3",
  autoplayTitle: "Aisha — Welcome Summary",
  autoplaySubtitle: "About one minute — plays when you open Audio.",
  /** Local NotebookLM-style dialogue (Aisha + Webster) on digital property fractionalization. */
  aishaWebsterSrc: "/talisu/Aisha-Webster.mp3",
  aishaWebsterSubtitle:
    "Digital Property Fractionalization — with Aisha & Webster",
  aishaWebsterVtt: "/talisu/Aisha-Webster.vtt",
  playHint: "A short welcome plays first. Other clips list and play like Knowledge Base Audios.",
} as const;

/** Audio library cards — same presentation pattern as KB Audios. */
export type TalisUAudioLibraryItem = {
  id: string;
  title: string;
  description: string;
  src: string;
  kind: string;
  captionsSrc?: string;
  autoplay?: boolean;
};

export const TALISU_AUDIO_LIBRARY: readonly TalisUAudioLibraryItem[] = [
  {
    id: "aisha-summary",
    title: "Aisha — Welcome Summary",
    description: "Short (~1 minute) welcome audio from the TalisU™ home experience.",
    src: "/talisu/Aisha.mp3",
    kind: "Audio",
    autoplay: true,
  },
  {
    id: "aisha-webster",
    title: "Digital Property Fractionalization — Aisha & Webster",
    description:
      "NotebookLM-style dialogue on digital property fractionalization. Transcript below.",
    src: "/talisu/Aisha-Webster.mp3",
    kind: "Audio",
    captionsSrc: "/talisu/Aisha-Webster.vtt",
  },
] as const;

export const TALISU_REGISTER = {
  title: "Register Account",
  partnerHeading: "Your Marketing Partner",
  partnerName: "Aisha C. — Team Leader",
  partnerIntro:
    "My team and I help grow your real estate adjacent marketing initiatives along four broad parameters:",
  bullets: [
    {
      label: "Mapsites",
      text: "we provide dedicated map-based platforms that can serve as referral and co-promotion network tools when publishing special purpose or user generated contents. Please note: contents must be non-political and in good taste by generally accepted standards at our sole discretion. Contents deemed otherwise will be switched \"blind\" by our AI bots, immediately and without warning. Resubmissions are permissible.",
    },
    {
      label: "Talisbooks™ (TEB)",
      text: "we provide and manage your online bookshelf to highlight qualifying listings (QL) by actively promoting pinned digital publications globally. Of course, QL are those that pay you enough and have enough term to improve performance metrics over time.",
    },
    {
      label: "Listing analysis (TVA)",
      text: "we analyze qualifying listings to establish suitability for investor classes that seek advanced transaction structures, including SPLITS, Fractionalization and Tokenization. Since all are often incompatible with exposure on traditional industry platforms they require Mapsites for promotional purposes.",
    },
    {
      label: "TalisTV™ (TTV)",
      text: "we provide and manage an in-house online TV Station by giving it its digital home. Additionally, we provide and manage AI video production and assist in weekly channel programming to include virtual walk throughs, digital open houses and, of course, value added proposals.",
    },
  ],
  closing: "Please add us as a resource…!",
  samcartUrl: "https://talispros.mysamcart.com/checkout/register",
} as const;

export const TALISU_ENGAGE = {
  title: "Engage the Team",
  headline: "Send a Down Payment to engage Webster and his Customization Team",
  partnerHeading: "Your Customization Partner",
  partnerName: "Webster M. — Team Leader",
  partnerImage: "/talisu/webster-team-leader-v2.jpg",
  partnerImageAlt: "Webster M.",
  paragraphs: [
    'Modular container or dome structures unlock "hyper-mobility" with structural reliability, allowing traffic-reliant businesses to deploy physical locations exactly where they find their customers.',
    "Built from standardized, durable “Corten” steel (corrosion resistant with high tensile strength) or fibreglass, prefabricated modules can be operationalized quickly.",
    "When installed on mobile platforms, they may negate the need for Building Permits in many North American jurisdictions.",
  ],
  helpHeading: "How we help:",
  helpItems: [
    "Select a design and send a $2,000 Down Payment.",
    "It is applied in full to your order - and…",
    "Establishes your spot in the production and shipping queues.",
    "It also reserves time with our customization department to precisely realize your vision.",
  ],
  protectionHeading: "Down Payment Protection:",
  protectionText:
    "Your downpayment is protected for up to 12 months (or more by special arrangement on a case by case basis).",
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
