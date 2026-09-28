/**
 * Landscape Open Graph card for Talispros™ homepage + T-All Product catalogue.
 * 1200×630. Soft market-chrome background, Talispros™ logo and Aisha portrait
 * stacked on the left; ALLPINS Mapsite™ multi-pin Canada map on the right.
 */

import { SHARE_OG_HEIGHT, SHARE_OG_LOGO_PATH, SHARE_OG_WIDTH } from "@/lib/share/og-card";

export const TALISPROS_OG_WIDTH = SHARE_OG_WIDTH;
export const TALISPROS_OG_HEIGHT = SHARE_OG_HEIGHT;

/** Chrome wordmark — same asset as Mapsite™ / bookshelf share cards. */
export const TALISPROS_OG_LOGO_PATH = SHARE_OG_LOGO_PATH;

/** Market-partner portrait used on Claim a Market / Mapsite™ left cards. */
export const TALISPROS_OG_PARTNER_PATH = "/images/mapsites/aisha-c.webp";

export const TALISPROS_OG_BG = "#f2f2f0";

export const TALISPROS_OG_LOGO_MAX_WIDTH = 110;
export const TALISPROS_OG_LOGO_MAX_HEIGHT = 110;
export const TALISPROS_OG_LEFT_MARGIN = 56;
export const TALISPROS_OG_TOP_MARGIN = 40;

export const TALISPROS_OG_PARTNER_WIDTH = 320;
export const TALISPROS_OG_PARTNER_HEIGHT = 420;
export const TALISPROS_OG_PARTNER_GAP_BELOW_LOGO = 20;

/** Shared brand card for homepage + `/catalogue` (T-All). */
export function talisprosBrandShareOgPath(): string {
  return "/api/og/talispros";
}

/** Logo parked top-left. */
export function talisprosOgLogoPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  return {
    left: TALISPROS_OG_LEFT_MARGIN,
    top: TALISPROS_OG_TOP_MARGIN,
    width: TALISPROS_OG_LOGO_MAX_WIDTH,
    height: TALISPROS_OG_LOGO_MAX_HEIGHT,
  };
}

/** Aisha portrait under the logo, still on the left half of the frame. */
export function talisprosOgPartnerPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const logo = talisprosOgLogoPlacement();
  return {
    left: TALISPROS_OG_LEFT_MARGIN,
    top: logo.top + logo.height + TALISPROS_OG_PARTNER_GAP_BELOW_LOGO,
    width: TALISPROS_OG_PARTNER_WIDTH,
    height: TALISPROS_OG_PARTNER_HEIGHT,
  };
}

/** Right half — ALLPINS multi-pin Mapsite™ map fills this panel. */
export function talisprosOgMapPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const width = Math.floor(TALISPROS_OG_WIDTH / 2);
  return {
    left: TALISPROS_OG_WIDTH - width,
    top: 0,
    width,
    height: TALISPROS_OG_HEIGHT,
  };
}

