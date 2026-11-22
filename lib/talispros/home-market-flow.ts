/**
 * Home Market "Personalize" flow (Ralf, Nov 21 and 22).
 *
 * The visitor picks a market PIN, then personalizes: first name, account type,
 * optional brokerage name, and a Home PIN. A preview of their own Mapsite
 * builds up behind the form as they go. Nothing is saved on the server here.
 * When every step is done, "Build Mapsite" shows Aisha's line, and the button
 * becomes "Register this Market", which opens the matching Register button
 * with Aisha's public Agent Code ready to enter.
 */

import { homeMarketDisplayName, type HomeMarketPin } from "@/lib/talisu/north-america-markets";

export const HOME_MARKET_ACCOUNT_TYPES = ["broker", "agent", "fsbo", "adpro"] as const;
export type HomeMarketAccountType = (typeof HOME_MARKET_ACCOUNT_TYPES)[number];

export function isHomeMarketAccountType(value: string | null | undefined): value is HomeMarketAccountType {
  return (HOME_MARKET_ACCOUNT_TYPES as readonly string[]).includes(value ?? "");
}

/** Aisha's public Agent Code (not secret; it only opens checkout). */
export const HOME_MARKET_AGENT_CODE = "Aishaa";

export const HOME_MARKET_FIRST_NAME_MAX = 40;
export const HOME_MARKET_BROKERAGE_MAX = 80;

/**
 * Green-screen portrait when the visitor has not uploaded a photo yet.
 * The book back cover is Aisha, so this uses a Centrefold green page.
 * Ralf will send a standalone image later — swap this one constant.
 */
export const HOME_MARKET_PHOTO_FALLBACK = "/talisbooks/centrefold/pages/page-08.webp";

export type HomeMarketDraft = {
  firstName: string;
  accountType: HomeMarketAccountType | null;
  brokerage: string;
  /** Object-URL or empty; client-side only, not required to register. */
  photoUrl: string;
  /** The visitor searched an address or placed the Home PIN. */
  pinPlaced: boolean;
  homeAddress: string;
};

export const EMPTY_HOME_MARKET_DRAFT: HomeMarketDraft = {
  firstName: "",
  accountType: null,
  brokerage: "",
  photoUrl: "",
  pinPlaced: false,
  homeAddress: "",
};

/** First name, trimmed, single spaces, capped. */
export function cleanFirstName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, HOME_MARKET_FIRST_NAME_MAX);
}

/** Required steps: first name, account type, Home PIN. */
export const HOME_MARKET_REQUIRED_STEPS = 3;

export function homeMarketStepsDone(draft: HomeMarketDraft): number {
  let done = 0;
  if (cleanFirstName(draft.firstName)) done += 1;
  if (draft.accountType) done += 1;
  if (draft.pinPlaced) done += 1;
  return done;
}

export function homeMarketComplete(draft: HomeMarketDraft): boolean {
  return homeMarketStepsDone(draft) === HOME_MARKET_REQUIRED_STEPS;
}

/** Background Home Page opacity: faint at the start, fully visible when done. */
export const HOME_MARKET_PREVIEW_MIN_OPACITY = 0.15;

export function homeMarketPreviewOpacity(draft: HomeMarketDraft, built: boolean): number {
  if (built) return 1;
  const share = homeMarketStepsDone(draft) / HOME_MARKET_REQUIRED_STEPS;
  const value = HOME_MARKET_PREVIEW_MIN_OPACITY + (1 - HOME_MARKET_PREVIEW_MIN_OPACITY) * share;
  return Math.round(value * 100) / 100;
}

export type HomeMarketStage = "personalize" | "build" | "register";

/** Personalize → Build Mapsite (all steps done) → Register this Market (after Build). */
export function homeMarketStage(draft: HomeMarketDraft, built: boolean): HomeMarketStage {
  if (built) return "register";
  return homeMarketComplete(draft) ? "build" : "personalize";
}

/** "Good job, Sam. Your market is available. We look forward to working with you." */
export function homeMarketGoodJob(firstName: string, template: string): string {
  const name = cleanFirstName(firstName);
  return template.replace("{name}", name).replace(/ ,/g, ",");
}

/**
 * The Register page with the matching button chosen and the entry-code box
 * open with Aisha's code filled in. The Register page checks the code again.
 */
export function homeMarketRegisterHref(accountType: HomeMarketAccountType, market: HomeMarketPin): string {
  const params = new URLSearchParams({
    product: accountType,
    locked: "code",
    code: HOME_MARKET_AGENT_CODE,
    market: market.id,
  });
  return `/register?${params.toString()}`;
}

/** Tells Aisha's agent (v9) this call follows Build Mapsite. */
export const HOME_MARKET_AISHA_ENTRY_CONTEXT = "build_complete";

/**
 * Aisha's spoken opening after Build Mapsite. Her agent speaks English, so
 * this stays English on every locale. It ends with the v8 pricing question.
 */
export function homeMarketAishaFirstMessage(firstName: string): string {
  const name = cleanFirstName(firstName);
  const hello = name ? `Good job, ${name}.` : "Good job.";
  return `${hello} Your market is available. We look forward to working with you. Would you like me to explain pricing?`;
}

/**
 * Dynamic variables for Aisha's live call after Build Mapsite. The names match
 * the placeholders on her agent; ordinary calls get the defaults
 * (entry_context "standard"), so only this call takes the post-build path.
 */
export function homeMarketAishaDynamicVariables(
  firstName: string,
  market: HomeMarketPin,
  accountType: HomeMarketAccountType | null,
): string {
  const vars = {
    signed_in: "no",
    first_name: cleanFirstName(firstName),
    home_market: homeMarketDisplayName(market),
    account_type: accountType ?? "",
    entry_context: HOME_MARKET_AISHA_ENTRY_CONTEXT,
  };
  return JSON.stringify(vars).replace(/</g, "\\u003c");
}
