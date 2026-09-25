/**
 * Portrait Open Graph card for Talisbooks™ bookshelf shares.
 * 1080×1350 (~4:5) — distinct from landscape Mapsite™ / viewer parting-shot cards.
 * Soft alcove, shelf planks, one standing book, Talispros™ mark.
 */

import { SHARE_OG_LOGO_PATH } from "@/lib/share/og-card";

export const BOOKSHELF_OG_WIDTH = 1080;
export const BOOKSHELF_OG_HEIGHT = 1350;

/** Reuse the same chrome wordmark as landscape share cards. */
export const BOOKSHELF_OG_LOGO_PATH = SHARE_OG_LOGO_PATH;

export const BOOKSHELF_OG_LOGO_MAX_WIDTH = 220;
export const BOOKSHELF_OG_LOGO_MAX_HEIGHT = 220;
export const BOOKSHELF_OG_LOGO_MARGIN_TOP = 72;

/** Shared portrait card for every bookshelf route. */
export function bookshelfShareOgPath(): string {
  return "/api/og/bookshelf";
}

/** Brand mark parked near the top, horizontally centered. */
export function bookshelfOgLogoPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const width = BOOKSHELF_OG_LOGO_MAX_WIDTH;
  const height = BOOKSHELF_OG_LOGO_MAX_HEIGHT;
  return {
    left: Math.round((BOOKSHELF_OG_WIDTH - width) / 2),
    top: BOOKSHELF_OG_LOGO_MARGIN_TOP,
    width,
    height,
  };
}

/**
 * SVG scene: alcove wall, two shelf planks, one standing hardcover on the
 * lower plank (spine + cover + page edges). Drawn in OG pixel space.
 */
export function bookshelfOgSceneSvg(): string {
  const w = BOOKSHELF_OG_WIDTH;
  const h = BOOKSHELF_OG_HEIGHT;
  // Standing book geometry (lower shelf).
  const bookW = 210;
  const bookH = 320;
  const bookX = Math.round(w / 2 - bookW / 2);
  const bookY = 780;
  const spineW = 28;
  const coverX = bookX + spineW;
  const coverW = bookW - spineW - 10;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3f0eb"/>
      <stop offset="55%" stop-color="#e8e2d8"/>
      <stop offset="100%" stop-color="#d9d1c4"/>
    </linearGradient>
    <linearGradient id="plankFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f2f0ec"/>
    </linearGradient>
    <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c4a6e"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#7dd3fc"/>
    </linearGradient>
    <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#082f49"/>
      <stop offset="100%" stop-color="#0c4a6e"/>
    </linearGradient>
    <linearGradient id="pages" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <filter id="bookShadow" x="-30%" y="-10%" width="160%" height="140%">
      <feDropShadow dx="8" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>

  <!-- Alcove wall -->
  <rect width="${w}" height="${h}" fill="url(#wall)"/>

  <!-- Side rails suggesting a niche -->
  <rect x="72" y="320" width="18" height="880" rx="4" fill="#cfc6b8" opacity="0.55"/>
  <rect x="${w - 90}" y="320" width="18" height="880" rx="4" fill="#cfc6b8" opacity="0.55"/>

  <!-- Upper empty shelf (structure) -->
  <g filter="url(#softShadow)">
    <rect x="120" y="520" width="${w - 240}" height="28" rx="6" fill="url(#plankFace)"/>
    <rect x="128" y="548" width="${w - 256}" height="14" rx="3" fill="#c4bbb0" opacity="0.55"/>
  </g>

  <!-- Lower shelf with standing book -->
  <g filter="url(#softShadow)">
    <rect x="120" y="1120" width="${w - 240}" height="32" rx="6" fill="url(#plankFace)"/>
    <rect x="128" y="1152" width="${w - 256}" height="16" rx="3" fill="#c4bbb0" opacity="0.6"/>
  </g>

  <!-- Standing book -->
  <g filter="url(#bookShadow)">
    <!-- Spine -->
    <path d="M${bookX} ${bookY + 8}
      L${bookX + spineW} ${bookY}
      L${bookX + spineW} ${bookY + bookH}
      L${bookX} ${bookY + bookH - 8} Z" fill="url(#spine)"/>
    <!-- Cover -->
    <rect x="${coverX}" y="${bookY}" width="${coverW}" height="${bookH}" rx="4" fill="url(#cover)"/>
    <!-- Page edge -->
    <path d="M${coverX + coverW} ${bookY + 6}
      L${coverX + coverW + 10} ${bookY + 14}
      L${coverX + coverW + 10} ${bookY + bookH - 14}
      L${coverX + coverW} ${bookY + bookH - 6} Z" fill="url(#pages)"/>
    <!-- Cover accent band -->
    <rect x="${coverX + 22}" y="${bookY + 48}" width="${coverW - 44}" height="10" rx="3" fill="#ffffff" opacity="0.85"/>
    <rect x="${coverX + 22}" y="${bookY + 72}" width="${Math.round((coverW - 44) * 0.62)}" height="8" rx="3" fill="#ffffff" opacity="0.55"/>
    <!-- Contact shadow on plank -->
    <ellipse cx="${bookX + bookW / 2}" cy="1124" rx="118" ry="14" fill="#000000" opacity="0.18"/>
  </g>
</svg>`;
}
