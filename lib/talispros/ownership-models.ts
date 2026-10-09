/**
 * Homepage (gate) right-rail ownership model copy — exact user wording.
 */
export const HOME_OWNERSHIP_BG_SRC = "/assets/home-ownership-bg.jpg";
/** Looping GIF kept as a fallback asset; the banner now plays the MP4. */
export const HOME_OWNERSHIP_BG_GIF = "/assets/home-ownership-bg.gif";
/**
 * Homepage ownership banner loop (muted, no audio track).
 * Source: Pic2VDO.mov → H.264 MP4, behind ownership title + metallic buttons.
 */
export const HOME_OWNERSHIP_BG_MP4 = "/assets/home-ownership-bg.mp4";

/** Title overlaid at the top of the homepage mountain ownership banner (moved to blue nav). */
export const HOME_OWNERSHIP_BANNER_TITLE =
  "Industry Adjacent Fulfilment Options";

/** Very small tagline directly above the four ownership structure squares. */
export const HOME_OWNERSHIP_STRUCTURES_TAGLINE =
  "Transaction Structures we support";

export type OwnershipModelSection = {
  id: string;
  title: string;
  body: string;
  result: string;
  /**
   * Learn More CTA in the popover. Level 2 (transaction structures) always
   * goes to the TalisU FAQ; it never re-opens TalisBOT (Level 1).
   */
  learnMoreHref?: string;
  learnMoreLabel?: string;
};

/** Every homepage transaction-structure Learn More goes to the TalisU FAQ. */
export const HOME_OWNERSHIP_LEARN_MORE_HREF = "/talisu";

export const HOME_OWNERSHIP_SECTIONS: readonly OwnershipModelSection[] = [
  {
    id: "conventional",
    title: "Conventional",
    body:
      "The way real estate was always acquired: you choose a property, make an offer, have that offer accepted and pay cash, or finance. Either way, title changes hands upon that last penny having been paid.",
    result:
      "The result: you have no ownership rights until you have paid in full, and full ownership rights when the transaction has closed.",
    learnMoreLabel: "Learn More",
    learnMoreHref: HOME_OWNERSHIP_LEARN_MORE_HREF,
  },
  {
    id: "splits",
    title: "SPLITS",
    body:
      'Similar to "Conventional", but includes a SPLITS period (Simple Project Lead & Input Tracking System). That avoids the bank, but requires money down and instalments until the transaction has closed.',
    result:
      "The result: you have full usage rights in accordance with a 'Lease-To-Own' Agreement drafted between lawyers.",
    learnMoreLabel: "Learn More",
    learnMoreHref: HOME_OWNERSHIP_LEARN_MORE_HREF,
  },
  {
    id: "fractionalization",
    title: "Fractionalization",
    body:
      "Fractionalization enables several participants to share one over-arching physical interest, which is divided into clearly defined slices, each with its own claim on rights and proportional upside.",
    result:
      "The result: it fits partners and investor groups, who want shares in the collective without an all-or-nothing purchase.",
    learnMoreLabel: "Learn More",
    learnMoreHref: HOME_OWNERSHIP_LEARN_MORE_HREF,
  },
  {
    id: "tokenization",
    title: "Tokenization",
    body:
      "Tokenization takes an interest—whole or fractional—and records it as a transferable digital asset. This is the cleanest, most auditable ownership and transaction structure and accounting option over time.",
    result:
      "The result: it is easy to bring in co-owners while keeping stakes proportional and raising capital without touching the underlying asset.",
    learnMoreLabel: "Learn More",
    learnMoreHref: HOME_OWNERSHIP_LEARN_MORE_HREF,
  },
] as const;
