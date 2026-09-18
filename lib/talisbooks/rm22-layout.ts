/**
 * RM22 Talisbook™ document coordinate system.
 *
 * One shared definition for composer, viewer, editor, and raster/PDF export.
 * Coordinates are in the designed page space — never the browser viewport.
 *
 * Interior spread: 1920×1080 (two 960×1080 leaves).
 * Cover rasters: 1080×1920. The viewer shows each cover as one 960×1080 leaf.
 *
 * Intrinsic Value is a split-copy spread, matching the Jarlberg investor page:
 *   LEFT leaf  = image slot only
 *   RIGHT leaf = title / body / signoff text slots
 */

export const RM22_DOCUMENT_PAGE_WIDTH = 1920;
export const RM22_DOCUMENT_PAGE_HEIGHT = 1080;
export const RM22_DOCUMENT_COVER_WIDTH = 1080;
export const RM22_DOCUMENT_COVER_HEIGHT = 1920;
export const RM22_DOCUMENT_LEAF_WIDTH = 960;
export const RM22_DOCUMENT_LEAF_HEIGHT = 1080;
/** Open-book cover leaf — same height as interiors in the Talisbooks™ viewer. */
export const RM22_VIEWER_COVER_ASPECT = `${RM22_DOCUMENT_LEAF_WIDTH} / ${RM22_DOCUMENT_LEAF_HEIGHT}`;

export const RM22_TEMPLATE_ID = "rm22" as const;

export const RM22_TYPE = {
  sans: 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif',
  script:
    'Zapfino, "Snell Roundhand", "Apple Chancery", "Segoe Script", cursive',
  hand: 'Noteworthy, "Bradley Hand", "Segoe Print", cursive',
  rounded: '"Arial Rounded MT Bold", "Varela Round", Arial, sans-serif',
} as const;

export const RM22_COLOR = {
  /** Caption strip over bleed photos — not a solid template color. */
  captionOverlay: "rgba(0, 0, 0, 0.3)",
  lime: "#c6de00",
  ink: "#111111",
  paper: "#ffffff",
  caption: "#ffffff",
} as const;

export const RM22_BLEED_TITLE_SHADOW =
  "0 1px 2px rgba(0,0,0,0.55), 0 4px 18px rgba(0,0,0,0.6)";

export type Rm22Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Rm22TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  lineHeight: number;
  align: "left" | "center" | "right";
  color: string;
};

export type Rm22TextSlotDef = {
  key: "title" | "caption" | "body" | "signoff";
  box: Rm22Box;
  style: Rm22TextStyle;
};

export type Rm22ImageSlotDef = {
  key: "image";
  box: Rm22Box;
  fit: "cover";
};

/** Intrinsic Value — left image leaf, right copy leaf. 50/50 at the gutter. */
export const RM22_INTRINSIC_IMAGE: Rm22ImageSlotDef = {
  key: "image",
  box: { x: 0, y: 0, width: RM22_DOCUMENT_LEAF_WIDTH, height: RM22_DOCUMENT_LEAF_HEIGHT },
  fit: "cover",
};

export const RM22_INTRINSIC_CAPTION: Rm22TextSlotDef = {
  key: "caption",
  box: { x: 0, y: 970, width: RM22_DOCUMENT_LEAF_WIDTH, height: 110 },
  style: {
    fontFamily: RM22_TYPE.hand,
    fontSize: 36,
    fontWeight: 400,
    fontStyle: "normal",
    lineHeight: 40,
    align: "center",
    color: RM22_COLOR.caption,
  },
};

export const RM22_INTRINSIC_TITLE: Rm22TextSlotDef = {
  key: "title",
  box: { x: 960, y: 72, width: RM22_DOCUMENT_LEAF_WIDTH, height: 80 },
  style: {
    fontFamily: RM22_TYPE.sans,
    fontSize: 48,
    fontWeight: 700,
    fontStyle: "normal",
    lineHeight: 56,
    align: "center",
    color: RM22_COLOR.ink,
  },
};

export const RM22_INTRINSIC_BODY: Rm22TextSlotDef = {
  key: "body",
  box: { x: 1032, y: 171, width: 790, height: 740 },
  style: {
    fontFamily: RM22_TYPE.sans,
    fontSize: 22,
    fontWeight: 400,
    fontStyle: "normal",
    lineHeight: 28,
    align: "left",
    color: RM22_COLOR.ink,
  },
};

export const RM22_INTRINSIC_SIGNOFF: Rm22TextSlotDef = {
  key: "signoff",
  box: { x: 1032, y: 952, width: 832, height: 48 },
  style: {
    fontFamily: RM22_TYPE.sans,
    fontSize: 32,
    fontWeight: 400,
    fontStyle: "normal",
    lineHeight: 36,
    align: "right",
    color: RM22_COLOR.ink,
  },
};

/** Full-bleed interior landscape (intro / photo-caption / outro). */
export const RM22_BLEED_IMAGE: Rm22ImageSlotDef = {
  key: "image",
  box: {
    x: 0,
    y: 0,
    width: RM22_DOCUMENT_PAGE_WIDTH,
    height: RM22_DOCUMENT_PAGE_HEIGHT,
  },
  fit: "cover",
};

export const RM22_BLEED_TITLE: Rm22TextSlotDef = {
  key: "title",
  box: { x: 80, y: 36, width: RM22_DOCUMENT_PAGE_WIDTH - 160, height: 110 },
  style: {
    fontFamily: RM22_TYPE.rounded,
    fontSize: 92,
    fontWeight: 700,
    fontStyle: "normal",
    lineHeight: 100,
    align: "center",
    color: RM22_COLOR.paper,
  },
};

export const RM22_BLEED_CAPTION: Rm22TextSlotDef = {
  key: "caption",
  box: { x: 0, y: RM22_DOCUMENT_PAGE_HEIGHT - 150, width: RM22_DOCUMENT_PAGE_WIDTH, height: 150 },
  style: {
    fontFamily: RM22_TYPE.hand,
    fontSize: 36,
    fontWeight: 400,
    fontStyle: "normal",
    lineHeight: 48,
    align: "center",
    color: RM22_COLOR.caption,
  },
};

export const RM22_INTRINSIC_BODY_MAX_LINES = Math.floor(
  RM22_INTRINSIC_BODY.box.height / RM22_INTRINSIC_BODY.style.lineHeight,
);

const AVG_SANS_CHAR_WIDTH_RATIO = 0.52;

function wrapCount(text: string, maxWidth: number, fontSize: number): number {
  const charWidth = Math.max(1, fontSize * AVG_SANS_CHAR_WIDTH_RATIO);
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  const paragraphs = text.replace(/\r/g, "").split("\n");
  let lines = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines += 1;
      continue;
    }
    let current = words[0] ?? "";
    for (const word of words.slice(1)) {
      const next = `${current} ${word}`;
      if (next.length <= maxChars) current = next;
      else {
        lines += 1;
        current = word;
      }
    }
    lines += 1;
  }
  return lines;
}

export type Rm22TextFitResult = {
  fits: boolean;
  lineCount: number;
  maxLines: number;
};

/** Template body fitting: keep typography, clip to the text region, warn if it cannot fit. */
export function rm22IntrinsicBodyFits(text: string): Rm22TextFitResult {
  const lineCount = wrapCount(
    text,
    RM22_INTRINSIC_BODY.box.width,
    RM22_INTRINSIC_BODY.style.fontSize,
  );
  return {
    fits: lineCount <= RM22_INTRINSIC_BODY_MAX_LINES,
    lineCount,
    maxLines: RM22_INTRINSIC_BODY_MAX_LINES,
  };
}

export function rm22BleedCaptionFits(text: string): Rm22TextFitResult {
  const maxLines = 2;
  const lineCount = wrapCount(
    text,
    RM22_BLEED_CAPTION.box.width - 80,
    RM22_BLEED_CAPTION.style.fontSize,
  );
  return {
    fits: lineCount <= maxLines,
    lineCount,
    maxLines,
  };
}

export function rm22IntrinsicCaptionFits(text: string): Rm22TextFitResult {
  const maxLines = Math.max(
    1,
    Math.floor(
      RM22_INTRINSIC_CAPTION.box.height / RM22_INTRINSIC_CAPTION.style.lineHeight,
    ),
  );
  const lineCount = wrapCount(
    text,
    RM22_INTRINSIC_CAPTION.box.width * 0.84,
    RM22_INTRINSIC_CAPTION.style.fontSize,
  );
  return {
    fits: lineCount <= maxLines,
    lineCount,
    maxLines,
  };
}

export function boxToPagePercent(box: Rm22Box, page: Rm22Box): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${(100 * (box.x - page.x)) / page.width}%`,
    top: `${(100 * (box.y - page.y)) / page.height}%`,
    width: `${(100 * box.width) / page.width}%`,
    height: `${(100 * box.height) / page.height}%`,
  };
}

export const RM22_LEFT_LEAF_PAGE: Rm22Box = {
  x: 0,
  y: 0,
  width: RM22_DOCUMENT_LEAF_WIDTH,
  height: RM22_DOCUMENT_LEAF_HEIGHT,
};

export const RM22_RIGHT_LEAF_PAGE: Rm22Box = {
  x: RM22_DOCUMENT_LEAF_WIDTH,
  y: 0,
  width: RM22_DOCUMENT_LEAF_WIDTH,
  height: RM22_DOCUMENT_LEAF_HEIGHT,
};

export const RM22_SPREAD_PAGE: Rm22Box = {
  x: 0,
  y: 0,
  width: RM22_DOCUMENT_PAGE_WIDTH,
  height: RM22_DOCUMENT_PAGE_HEIGHT,
};

export function fontSizeCqh(sizePx: number, pageHeight = RM22_DOCUMENT_PAGE_HEIGHT): string {
  return `${((100 * sizePx) / pageHeight).toFixed(4)}cqh`;
}
