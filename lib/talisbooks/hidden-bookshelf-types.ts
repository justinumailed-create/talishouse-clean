/**
 * Types for the hidden (unlisted) bookshelf. See `hidden-bookshelf.ts`.
 */

export type HiddenBookBlock =
  | { type: "lead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "date"; text: string }
  | { type: "list"; items: readonly string[] }
  | { type: "hurdle"; hurdle: string; cleared: string }
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "illus"; src: string; alt: string }
  | { type: "toc"; items: readonly { label: string; page: number }[] }
  | { type: "nameplate"; text: string }
  | { type: "oops"; title: string; text: string }
  | {
      type: "table";
      rows: readonly { when: string; hurdle: string; cleared: string }[];
    }
  | { type: "signoff"; name: string; role: string };

/** One interior page of a hidden book (cover pages are images only). */
export type HiddenBookPage = {
  pageNumber: number;
  kicker: string;
  title: string;
  blocks: readonly HiddenBookBlock[];
};

export type HiddenBook = {
  /** URL slug: `/private-shelf/{slug}`. */
  slug: string;
  title: string;
  subtitle: string;
  /** Share-card / meta description. */
  description: string;
  /** Public folder holding front.jpg, back.jpg, cover-thumb.jpg, spread-NN.jpg. */
  assetBase: string;
  /** Portrait shelf thumbnail (600×840). */
  coverImage: string;
  /** Portrait front cover (1200×1340). */
  frontCover: string;
  /** Portrait back cover (1200×1340). */
  backCover: string;
  /** Landscape interior spreads (2400×1340), two pages each. */
  spreads: number;
  /** Plain-text source of the interior pages, in page order. */
  pages: readonly HiddenBookPage[];
  /** Spine colour behind the cover on the shelf. */
  coverGradient: string;
};
