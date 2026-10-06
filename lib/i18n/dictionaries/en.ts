/**
 * English UI dictionary (source of truth for keys).
 *
 * Long-form marketing copy that already lives in content modules is
 * referenced here (not duplicated) so existing English stays byte-identical.
 * `de.ts` must provide the same shape — enforced by the `Dictionary` type and
 * __tests__/i18n-dictionary-parity.test.ts.
 */
import {
  TALISU_ENGAGE,
  TALISU_FAQ,
  TALISU_REGISTER,
} from "@/lib/talisu/content";
import {
  HOME_OWNERSHIP_BANNER_TITLE,
  HOME_OWNERSHIP_SECTIONS,
  HOME_OWNERSHIP_STRUCTURES_TAGLINE,
} from "@/lib/talispros/ownership-models";
import { TALISBOT_KNOWLEDGE } from "@/lib/talispros/talisbot-knowledge";
import { NANP_PHONE_ERROR } from "@/lib/talispros/nanp-phone";
import { TALISPROS_LEGAL_SECONDARY_COPY } from "@/lib/talispros/start-content";
import { TALISU_MKTS_HEADER_TAGLINE } from "@/lib/talisu/markets-pins";

export const en = {
  langSwitch: {
    groupLabel: "Language",
    en: "EN",
    de: "DE",
    enName: "English",
    deName: "Deutsch",
  },

  common: {
    back: "← Back",
    close: "Close",
    done: "Done",
    somethingWrong: "Something went wrong. Please try again.",
    opening: "Opening…",
  },

  nav: {
    tagline: TALISU_MKTS_HEADER_TAGLINE,
    brandSr: "Brand: Talispros™",
    markets: "Markets",
    mapsites: "Mapsites",
    bookshelf: "Bookshelf",
    catalogue: "Catalogue",
    register: "Register",
    dashboard: "Dashboard",
    talisu: "TalisU",
    menuBack: "← Menu",
    registerMenu: {
      mapsite: "Mapsite",
      product: "Product",
    },
    talisuMenu: {
      faq: "FAQ",
      knowledgeBase: "Knowledge Base",
      audio: "Audio",
      video: "Video",
    },
    dashboardLocked: {
      title: "Dashboard is locked",
      body: "Register to unlock your Mapsite™ Dashboard after payment succeeds.",
      cta: "Register",
    },
    mapsitesMenu: {
      title: "Mapsites™",
      prompt: "Enter your FAST Code™ to open your personal Mapsite™.",
      fieldLabel: "FAST Code™",
      placeholder: "FAST Code™",
      submit: "Open Mapsite™",
      opening: "Opening…",
      demo: "Demo Mapsite™",
      errEmpty: "Please enter a FAST Code™.",
      errChars: "Use letters and digits only (no & or +).",
      errOpen: "Unable to open that Mapsite™.",
    },
  },

  kbUnlock: {
    title: "Knowledge Base",
    prompt: "Enter your password to unlock.",
    passwordLabel: "Password",
    placeholder: "Password",
    error: "Incorrect password. Try again.",
    submit: "Unlock",
  },

  home: {
    motto: "PROMOTE - MANAGE - COOPERATE",
    openAccount: "Open your Account*",
    systemDemo: "System Demo",
    legalSecondary: TALISPROS_LEGAL_SECONDARY_COPY,
    bannerTitle: HOME_OWNERSHIP_BANNER_TITLE,
    structuresTagline: HOME_OWNERSHIP_STRUCTURES_TAGLINE,
    ownershipAria: "Ownership models",
    closeDetails: "Close {title} details",
    learnMore: "Learn More",
    samcartReturn: {
      confirming: "Confirming payment return…",
      received: "Payment return received — Mapsite™ unlock in progress.",
      detected: "Payment return detected.",
      order: "SamCart order",
      openClaimed: "Open your claimed Mapsite™",
      useAccountBefore: "Use",
      useAccountAfter: "with your FAST Code™ to open your Mapsite™.",
      failedNote:
        "Return detected but session setup failed. Use Login with your FAST Code™.",
    },
    /** Keyed by section id (conventional / splits / fractionalization / tokenization). */
    ownershipSections: HOME_OWNERSHIP_SECTIONS,
    corner: {
      markets: "Markets",
      globalAdmin: "Global Admin",
    },
    /** Markets dropdown audiences, same order as TALISPROS_START_SEGMENTS. */
    segments: [
      { label: "Owners / Managers", title: "Broker or Team Leader" },
      { label: "Licensed", title: "Real Estate Professional" },
      { label: "Unlicensed", title: "For-Sale-By-Owner" },
      { label: "Adpro™", title: "Product & Service Providers" },
    ],
    fastCode: {
      formAria: "Open Mapsite™ with FAST Code",
      label: "FAST Code™",
      placeholder: "Enter your FAST Code",
      submit: "Mapsite",
      opening: "Opening…",
      errEmpty: "Please enter a FAST Code.",
      errOpen: "Unable to open that Mapsite™.",
    },
  },

  talisu: {
    faq: TALISU_FAQ,
    register: TALISU_REGISTER,
    engage: TALISU_ENGAGE,
    engageCustomizing: "Customizing:",
    engageCataloguePage: "Talishouse™ Product Catalogue page {page}",
    engageChange: "Change",
    footerPartOf: "part of",
  },

  bot: {
    name: "TalisBOT",
    subtitle: "Talispros™ processes",
    openAria: "Open TalisBOT",
    closeAria: "Close TalisBOT",
    faq: "FAQ",
    getHelp: "Get help / leave contact",
    processesHeading: "Talispros™ processes",
    allTopics: "← All topics",
    contactAbout: "Contact about this",
    back: "← Back",
    knowledge: TALISBOT_KNOWLEDGE,
  },

  contactForm: {
    title: "Learn More",
    intro: "Tell us about your interest — we'll follow up.",
    thanks: "Thanks — your message is on its way.",
    advisor: "A Talispros™ advisor will contact you about {topic}.",
    done: "Done",
    name: "Name",
    namePlaceholder: "Full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone",
    phonePlaceholder: "(555) 555-5555",
    phoneError: NANP_PHONE_ERROR,
    project: "Propose a Project",
    projectPlaceholder: "Propose a Project",
    sending: "Sending…",
    submit: "Send inquiry",
    networkError: "Network error. Please try again.",
    genericError: "Something went wrong. Please try again.",
    back: "← Back",
    /** Topic display names (the English topic is still what gets submitted). */
    topics: {
      Conventional: "Conventional",
      SPLITS: "SPLITS",
      Fractionalization: "Fractionalization",
      Tokenization: "Tokenization",
    },
    /** Server (API) error strings → localized text. Keys are the API's English. */
    apiErrors: {
      required: "Name, email, phone, and message are required.",
      email: "Enter a valid email.",
      save: "Could not save your inquiry. Please try again.",
    },
  },

  meta: {
    root: {
      title: "Talishouse | Homes & Cottages",
      description:
        "Modern homes and cottages starting from $58.50 per sq.ft. . Built in a day, move-in ready in a week. Lease-to-own options available.",
    },
    home: {
      title: "Talispros™",
      description: "Claim your market. Open your Mapsite™.",
    },
    talisuLayout: {
      title: "TalisU™",
      description:
        "Industry adjacent fulfilment options — Conventional, SPLITS, Fractionalization, and Tokenization.",
    },
    talisuFaq: {
      title: "TalisU™ | FAQ",
      description:
        "Frequently asked questions about Talispros™, Mapsites™, and TalisU™.",
    },
    talisuRegister: {
      title: "TalisU™ | Register Account",
      description:
        "Register your TalisU™ marketing partner account via SamCart checkout.",
    },
    talisuEngage: {
      title: "TalisU™ | Engage the Team",
      description:
        "Send a down payment to engage Webster and the customization team for Glasshouse, Talishouse, Talistown, or Talisdome projects.",
    },
  },
} as const;
