/**
 * Homepage (gate) right-rail ownership model copy — exact user wording.
 */
export const HOME_OWNERSHIP_BG_SRC = "/assets/home-ownership-bg.jpg";
/** Looping GIF: subtle Ken Burns plus sky cloud drift. Primary motion asset. */
export const HOME_OWNERSHIP_BG_GIF = "/assets/home-ownership-bg.gif";

/** Title overlaid at the top of the homepage mountain ownership banner. */
export const HOME_OWNERSHIP_BANNER_TITLE =
  "Industry Adjacent Fulfilment Options 101";

export type OwnershipModelSection = {
  id: string;
  title: string;
  body: string;
  result: string;
  /** Optional CTA shown in the popover (e.g. Tokenization → Learn More). */
  learnMoreHref?: string;
  learnMoreLabel?: string;
};

export const HOME_OWNERSHIP_SECTIONS: readonly OwnershipModelSection[] = [
  {
    id: "conventional",
    title: "Conventional",
    body:
      "The way real estate was always acquired: you choose a property, make an offer, have that offer accepted and pay cash, or finance. Either way, title changes hands upon that last penny having been paid.",
    result:
      "The result: you have no ownership rights until you have paid in full, and full ownership rights when the transaction has closed.",
  },
  {
    id: "splits",
    title: "SPLITS",
    body:
      'Similar to "Conventional", but includes a SPLITS period (Simple Project Lead & Input Tracking System). That avoids the bank, but requires money down and instalments until the transaction has closed.',
    result:
      "The result: you have full usage rights in accordance with a 'Lease-To-Own' Agreement drafted between lawyers.",
  },
  {
    id: "fractionalization",
    title: "Fractionalization",
    body:
      "Fractionalization enables several participants to share one over-arching physical interest, which is divided into clearly defined slices, each with its own claim on rights and proportional upside.",
    result:
      "The result: it fits partners and investor groups, who want shares in the collective without an all-or-nothing purchase.",
  },
  {
    id: "tokenization",
    title: "Tokenization",
    body:
      "Tokenization takes an interest—whole or fractional—and records it as a transferable digital asset. This is the cleanest, most auditable ownership and transaction structure and accounting option over time.",
    result:
      "The result: it is easy to bring in co-owners while keeping stakes proportional and raising capital without touching the underlying asset.",
    learnMoreHref: "/learn-more",
    learnMoreLabel: "Learn More",
  },
] as const;
