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
import { MARKETING_PARTNER_CARD_INTRO } from "@/lib/talispros/market-pages";
import {
  MAPSITE_URL_GATE_HEADLINE,
  MAPSITE_URL_GATE_TTL_LABEL,
} from "@/lib/talispros/mapsite-url-gate";
import {
  TALISU_MKTS_FOOTER,
  TALISU_MKTS_HEADER_TAGLINE,
  TALISU_MKTS_PMC_BULLETS,
  TALISU_MKTS_PMC_TITLE,
} from "@/lib/talisu/markets-pins";

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
      body: "Register to unlock your Mapsite Dashboard after payment succeeds.",
      cta: "Register",
    },
    mapsitesMenu: {
      title: "Mapsites",
      prompt: "Enter your FAST Code™ to open your personal Mapsite.",
      fieldLabel: "FAST Code™",
      placeholder: "FAST Code™",
      submit: "Open Mapsite",
      opening: "Opening…",
      demo: "Demo Mapsite",
      errEmpty: "Please enter a FAST Code™.",
      errChars: "Use letters and digits only (no & or +).",
      errOpen: "Unable to open that Mapsite.",
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
      received: "Payment return received — Mapsite unlock in progress.",
      detected: "Payment return detected.",
      order: "SamCart order",
      openClaimed: "Open your claimed Mapsite",
      useAccountBefore: "Use",
      useAccountAfter: "with your FAST Code™ to open your Mapsite.",
      failedNote:
        "Return detected but session setup failed. Use Login with your FAST Code™.",
    },
    /** Keyed by section id (conventional / splits / fractionalization / tokenization). */
    ownershipSections: HOME_OWNERSHIP_SECTIONS,
    corner: {
      markets: "Markets",
    },
    /** Markets dropdown audiences, same order as TALISPROS_START_SEGMENTS. */
    segments: [
      { label: "Owners / Managers", title: "Broker or Team Leader" },
      { label: "Licensed", title: "Real Estate Professional" },
      { label: "Unlicensed", title: "For-Sale-By-Owner" },
      { label: "Adpro™", title: "Product & Service Providers" },
    ],
    fastCode: {
      formAria: "Open Mapsite with FAST Code",
      label: "FAST Code™",
      placeholder: "Enter your FAST Code",
      submit: "Mapsite",
      opening: "Opening…",
      errEmpty: "Please enter a FAST Code.",
      errOpen: "Unable to open that Mapsite.",
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
    getHelp: "Leave contact",
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

  markets: {
    pmcTitle: TALISU_MKTS_PMC_TITLE,
    pmcBullets: TALISU_MKTS_PMC_BULLETS,
    pmcTagline: "Promote - Manage - Cooperate",
    footer: TALISU_MKTS_FOOTER,
    searchPlaceholder: "Search a place or postal code…",
    searchAria: "Search place or postal code near markets",
    searchClear: "Clear search",
    searchFailed: "Place lookup failed. Try again.",
    searchNoResults: "No place found for that search.",
    distanceResultsAria: "Nearest PINs by distance",
    canada: "Canada",
    doMore: "Do More...",
    noMatches: "No matches",
    close: "Close",
    nextLabel: "Next Step...",
    marketDescription:
      "Claim an industry adjacent market place by building a Demo Mapsite.",
    /** Pin id → label (TALISU_MKTS_PINS). */
    pinLabels: {
      "nl": "Newfoundland & Labrador",
      "ns": "Nova Scotia",
      "nb-pei": "New Brunswick & PEI",
      "qc": "Quebec",
      "on-east": "Eastern Ontario",
      "on-south": "Southern Ontario",
      "on-north": "Northern Ontario",
      "on-west": "Western Ontario",
      "mb": "Manitoba",
      "sk": "Saskatchewan",
      "ab": "Alberta",
      "bc": "British Columbia",
      "yt": "Yukon Territory",
      "nt": "Northwest Territories",
      "nu": "Nunavut",
      "modular-spaces": "Talishouse™ Modular Spaces",
    },
    /** Do More pin descriptions by id. */
    doMoreDescriptions: {
      "modular-spaces":
        "Every registered market includes supply side access to a broad array of structures for DIY construction.",
    },
  },

  mapsite: {
    registerAccountNow: "Register Account now",
    buildMyMapsite: "Build My Mapsite",
    claimReceived: "Claim received",
    fastCodeCaps: "FAST CODE",
    knowledgeBase: "Knowledge Base",
    /** Default left-card tagline (owner-customized taglines stay as written). */
    partnerIntro: MARKETING_PARTNER_CARD_INTRO,
    logout: "Logout",
    loggingOut: "Logging out…",
    logoutAria: "Log out of Mapsite owner session",
    close: "Close",
    dashboardMenu: {
      ebooks: "Ebook Editor",
      branding: "Logo & Card Editor",
      pins: "PIN Dashboard",
      bookshelf: "Bookshelf Editor",
    },
    popup: {
      genericTitle: "The first of many E-Books",
      yourMapsite: "Your Mapsite",
      genericWriteup:
        "Upon registration your Mapsite will be able to promote up to 10 categories containing 100 PINs generating 1,000 views, monthly. No referral fees - ever",
      claimedFallback: "FAST Code™ {code} · claimed Mapsite.",
      welcomeFallback:
        "Welcome to Talispros™. Choose your market and begin onboarding.",
      tebPreparing:
        "Your first Talisbook™ is being prepared. TEB™ unlocks here when it's ready.",
      resourceUnavailable: "{label} unavailable",
      resourceNotConfigured: "{label} not configured yet",
      fastCodeLabel: "FAST Code: {code}",
    },
    startHere: {
      aria: "Start here. Continue to choose your E-Book.",
      title: "Start Here",
      subtitle: "Open your first Talisbook™",
    },
    urlGate: {
      headline: MAPSITE_URL_GATE_HEADLINE,
      intro:
        "Payment and listing links stay locked until a secure code from Global Admin is entered.",
      generating: "Generating…",
      generateNew: "Generate a new secure code",
      generate: "Generate secure code",
      generated:
        "Secure code generated and sent to Admin Notifications. Ask admin for the 6-digit code (valid {ttl}, single-use).",
      errGenerate: "Could not generate a secure code.",
      errUnlock: "Could not unlock the URL.",
      codeLabel: "Enter 6-digit secure code",
      checking: "Checking…",
      open: "Open URL",
      footnote:
        "Codes appear under Admin → Notifications with FAST Code and time. Each code works once and expires after {ttl}.",
      ttl: MAPSITE_URL_GATE_TTL_LABEL,
    },
    pinDashboard: {
      title: "PIN Dashboard",
      errCheckout: "Unable to start checkout.",
      errCoordsOrMap: "Enter a valid latitude and longitude, or click the map.",
      errCoords: "Enter a valid latitude and longitude.",
      placed: "PIN placed.",
      updated: "PIN updated.",
      checkoutSuccess:
        "Payment received. PIN capacity updates as soon as Stripe confirms it.",
      checkoutCancelled: "Checkout cancelled. No PINs were added.",
      included: "Included",
      onePin: "1 PIN",
      capacity: "Capacity",
      purchased: "Purchased",
      readyToPlace: "Ready to place",
      buyHeading: "Buy PINs · {price} CAD each",
      atLimit: "This Mapsite is at the 100 PIN limit.",
      quantity: "Quantity",
      startingCheckout: "Starting checkout…",
      buyOne: "Buy 1 PIN · {price} CAD",
      buyMany: "Buy {count} PINs · {price} CAD",
      leftOne: "1 PIN left to purchase.",
      leftMany: "{count} PINs left to purchase.",
      placeHeading: "Place and fix",
      placeHelp:
        "The included PIN stays on the listing. Place purchased PINs by clicking the map, or enter coordinates. Drag a PIN, or edit it here, to fix the location.",
      cancelPlacement: "Cancel placement",
      placeAPin: "Place a PIN",
      clickMap: "Click the map to drop the next PIN.",
      label: "Label",
      latitude: "Latitude",
      longitude: "Longitude",
      placeAtCoords: "Place at coordinates",
      savePin: "Save PIN",
      noneYet: "No additional PINs placed yet.",
      fixing: "Fixing",
      fix: "Fix",
    },
  },

  talisuHub: {
    talisTvSoon: "All Contents will be posted on TalisTV soon!",
    kbTitle: "Knowledge Base",
    kbSubtitle: "Audios, Videos, and Learning Material for TalisU™ partners.",
    buckets: {
      audios: "Audios",
      videos: "Videos",
      learning: "Learning Material",
    },
    kbTabsAria: "Knowledge Base sections",
    kbEmptyLearning:
      "Learning Material placeholders will grow here as guides are published.",
    kbEmpty: "No items in this section yet.",
    kbUpdateContent: "Update content",
    kbLogout: "Logout",
    kbLogoutAria: "Log out of Knowledge Base session",
    kbChecking: "Checking access…",
    kbUnlockHint: "You can also unlock from the TalisU menu in the header.",
  },

  viewer: {
    continueToRegister: "Continue to register",
    eyebrowFsbo: "Talisbooks™ FSBO Demo",
    eyebrowMagazine: "Talisbooks™ Magazine",
    eyebrowViewer: "Talisbooks™ Viewer",
    home: "Home",
    backToMapsite: "Back to Mapsite",
    product: "Product",
    downloadPdf: "Download PDF",
    markets: "Markets",
    globalAdmin: "Global Admin",
    portraitStage: "Portrait stage",
    landscapeStage: "Landscape stage",
    toPortraitAria: "Return viewer stage to portrait",
    toLandscapeAria: "Turn viewer stage to landscape",
    portrait: "Portrait",
    landscape: "Landscape",
    playback: "Playback",
    pause: "Pause",
    play: "Play",
    flipSpeed: "Flip speed",
    speedPresets: { slow: "Slow", normal: "Normal", fast: "Fast" },
    viewMode: "View mode",
    spread: "Spread",
    spreadView: "Spread view",
    single: "Single",
    singlePage: "Single page",
    previousPage: "Previous page",
    nextPage: "Next page",
    openMagazine: "Open magazine",
    openBook: "Open book",
    openMagazineSingle: "Open magazine · single page",
    openBookSingle: "Open book · single page",
    closedOpen: "Closed hardcover · Click to open",
    closedReopen: "Closed hardcover · Click to reopen",
  },

  bookshelf: {
    title: "Bookshelf",
    backToAllPins: "Back to ALL-PINs",
    createEbook: "Create ebook",
    ecosystem: "Talispros™ Ecosystem",
    rootAccount: "Root Account",
    derivativeAccount: "Derivative Account",
    subtitleScoped:
      "Open a cover to read. This shelf shows Talisbooks™ connected to FAST Code {code} only.",
    subtitleCreated:
      "Open a cover to read. Created Talisbooks™ with FAST codes stand on this shelf. The latest book is pinned on the left; older books stand on the right, newest first from the left.",
    subtitlePublic:
      "Open a cover to read. The featured book is pinned at the front of the shelf.",
    capacityTitle: "Fully stocked shelf monetization capacity",
    capacityLabel: "Shelf capacity",
    perMonth: "mo",
    register: "Register",
    lockedTitle: "Bookshelf locked",
    lockedBody:
      "Full bookshelf features, publishing, global marketing, additional uploads, derivative books, and Adpro books unlock after account activation. Your first draft remains available now.",
    highlightedAria: "Highlighted and scheduled books",
    featuredLayoutAria: "Featured layout",
    emptyFeatured: "No featured TalisBooks™ yet",
    emptyPublished: "No published TalisBooks™ yet",
    emptyCreated: "No created FAST Talisbooks™ yet",
    emptyScoped: "No ebook on this FAST Code shelf yet",
    emptyHighlighted: "No highlighted books yet",
    generalAria: "General library",
    savedOrder: "Saved order",
    sort: { published_desc: "Date", title_asc: "Name" },
    noBooks: "No books on this shelf",
    pageCount: "{page}/{count} ({total} books)",
    prev: "Prev",
    next: "Next",
    rootShelf: "Root shelf",
    derivativeShelf: "Derivative shelf",
  },

  catalogueUi: {
    register: "Register",
    home: "Home",
    bookshelf: "Bookshelf",
    previous: "Previous",
    next: "Next",
    customize: "Customize {label}",
    customizeDesign: "Customize a design",
    pageOf: "Page {page} of {count}",
  },

  demo: {
    downloadPdf: "Download Demo PDF",
    eyebrow: "DEMONSTRATION",
    title: "Demo eBook and Mapsite",
    placeAPin: "Place a pin.",
    createFromSample: "Create Talisbook™ from pinned sample",
    fastCodeOnRegistration: "FAST Code issued upon registration",
    listingTitle: "Listing title",
    defaultListingTitle: "Demo Mapsite",
    errPlacePin: "Place a pin or enter an address to continue.",
    continue: "Continue to demo eBook",
    continuing: "Continue to demo eBook…",
    nextNote:
      "Next you will extract the pinned Talispros eBook pages, optimize them, and Build the demonstration Talisbook™. No FAST Code is issued.",
    claimDescribe: "What best describes you?",
    claimChooseError: "Choose who you are (same options as /start) before claiming.",
    firstName: "First name",
    lastName: "Last name",
    cancel: "Cancel",
    claim: "Claim",
    claiming: "Claiming…",
    previewNeedName: "Enter a first and last name to preview your FAST Code™.",
    previewBased:
      "Based on “{name}” — initials {initials}. The final 2 digits are assigned when you claim.",
    previewError: "Could not preview FAST Code™ from that name.",
    previewTitle: "FAST Code™ preview",
  },

  login: {
    signIn: "Sign In",
    signInLower: "Sign in",
    signingIn: "Signing in...",
    email: "Email",
    password: "Password",
    genericError: "Something went wrong. Please try again.",
    clientTitle: "Client Analytics",
    clientSubtitle: "Sign in with your email and assigned FAST Code",
    clientCodePlaceholder: "e.g. LRG1",
    clientInvalid: "Invalid email or FAST Code.",
    marketingTitle: "Marketing Manager",
    marketingSubtitle: "Sign in to post daily metrics and checklist updates for clients",
    marketingInvalid: "Invalid email or password",
    associateTitle: "Associate Login",
    associateSubtitle: "Enter your FAST code to access your dashboard",
    associateCodePlaceholder: "e.g. FAST001",
    associateEmpty: "Please enter your FAST code.",
    associateInvalid: "Invalid FAST code. Please check and try again.",
    crmTitle: "CRM Login",
    crmSubtitle: "Enter your access code to continue",
    crmPlaceholder: "Access code",
    crmEmpty: "Please enter your access code.",
    crmInvalid: "Invalid access code. Please try again.",
    crmDemoCodes: "Demo access codes",
  },

  meta: {
    bookshelf: {
      title: "ALLPINS Talisbooks™ · Bookshelf",
      description:
        "Mapsite-connected Talisbooks™ bookshelf for FAST Code ALLPINS. Open a cover to read books on the isolated shelf.",
    },
    demoMapsite: {
      title: "Build Demo eBook and Mapsite",
      description:
        "Place a demonstration pin and attach the pinned Talispros eBook. No FAST Code is issued.",
    },
    catalogue: {
      title: "Catalogue | Talishouse™ Product Catalogue",
      description:
        "Talishouse™ Product Catalogue design ideas. Every design is numbered (P01, P02…) — tap one to register for that product.",
    },
    talisuKb: {
      title: "TalisU™ | Knowledge Base",
      description:
        "TalisU™ Knowledge Base — Audios, Videos, and Learning Material for Mapsites and FAST Codes™.",
    },
    talisuVideo: {
      title: "TalisU™ | Video",
      description:
        "TalisU™ video library and TalisTV™ programming.",
    },
    talisuAudio: {
      title: "TalisU™ | Audio",
      description:
        "Listen to TalisU™ audio — a short welcome autoplays, plus Aisha & Webster on digital property fractionalization.",
    },
    talisuMarkets: {
      title: "TalisU™ | Markets served",
      description:
        "Select the PIN nearest you to claim a market of 50 miles (80 kilometres) around a centre point as semi-exclusive territory. Semi-exclusive means no other markets will be granted within that circle, but neighbouring markets will not be prevented from pinning Listings for which they have written and verified listing documentation.",
    },
    root: {
      title: "Talishouse | Homes & Cottages",
      description:
        "Modern homes and cottages starting from $58.50 per sq.ft. . Built in a day, move-in ready in a week. Lease-to-own options available.",
    },
    home: {
      title: "Talispros™",
      description: "Claim your market. Open your Mapsite.",
    },
    talisuLayout: {
      title: "TalisU™",
      description:
        "Industry adjacent fulfilment options — Conventional, SPLITS, Fractionalization, and Tokenization.",
    },
    talisuFaq: {
      title: "TalisU™ | FAQ",
      description:
        "Frequently asked questions about Talispros™, Mapsites, and TalisU™.",
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
