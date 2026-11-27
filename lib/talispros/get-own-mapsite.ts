/**
 * Platform "Get your own Mapsite" button on personal home pages.
 * Visibility is a site-wide Admin flag (default on). Owner-made buttons
 * that already go to /home-market are treated as the same CTA so a page
 * like RM22 never shows two copies.
 */
import { HOME_MARKET_PATH } from "@/lib/talisu/home-market-path";
import type { PersonalHomeButton } from "@/lib/talispros/personal-home";

export const GET_OWN_MAPSITE_HREF = HOME_MARKET_PATH;

/** GlobalContent.id for the on/off flag. No new table is required. */
export const GET_OWN_MAPSITE_FLAG_ID = "get_own_mapsite_button";

/** Shown immediately when the flag row has not been saved yet. */
export const GET_OWN_MAPSITE_FLAG_DEFAULT = true;

const OFF_VALUES = new Set(["off", "false", "0", "no", "hidden"]);
const ON_VALUES = new Set(["on", "true", "1", "yes", "show"]);

/** Parse a GlobalContent.title (or any stored value). Missing/unknown => on. */
export function parseGetOwnMapsiteFlag(value: unknown): boolean {
  if (value == null) return GET_OWN_MAPSITE_FLAG_DEFAULT;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return GET_OWN_MAPSITE_FLAG_DEFAULT;
  if (OFF_VALUES.has(raw)) return false;
  if (ON_VALUES.has(raw)) return true;
  return GET_OWN_MAPSITE_FLAG_DEFAULT;
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/** True when a href is the public Home Market page, on any host. */
export function isGetOwnMapsiteHref(href: string): boolean {
  const raw = href.trim();
  if (!raw) return false;
  try {
    const url = /^https?:\/\//i.test(raw)
      ? new URL(raw)
      : new URL(raw, "https://www.tsplits.com");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return path === GET_OWN_MAPSITE_HREF;
  } catch {
    return /^\/home-market\/?(?:[?#].*)?$/i.test(raw);
  }
}

export function isGetOwnMapsiteLabel(
  label: string,
  localizedLabels: readonly string[] = [],
): boolean {
  const norm = normalizeLabel(label);
  if (!norm) return false;
  const needles = new Set(
    ["get your own mapsite", ...localizedLabels.map(normalizeLabel)].filter(Boolean),
  );
  return needles.has(norm);
}

export function isGetOwnMapsiteButton(
  button: { label: string; href: string },
  localizedLabels: readonly string[] = [],
): boolean {
  return (
    isGetOwnMapsiteHref(button.href) ||
    isGetOwnMapsiteLabel(button.label, localizedLabels)
  );
}

/**
 * When the flag is on, keep an existing owner button or append the platform
 * one. When the flag is off, hide both the platform button and any matching
 * owner-made copy so the Admin toggle actually turns the CTA off.
 */
export function applyGetOwnMapsiteButton(
  buttons: readonly PersonalHomeButton[],
  options: { enabled: boolean; label: string; href?: string },
): PersonalHomeButton[] {
  const labels = [options.label];
  const href = options.href?.trim() || GET_OWN_MAPSITE_HREF;
  if (!options.enabled) {
    return buttons.filter((button) => !isGetOwnMapsiteButton(button, labels));
  }
  if (buttons.some((button) => isGetOwnMapsiteButton(button, labels))) {
    return [...buttons];
  }
  return [...buttons, { label: options.label.trim(), href, kind: "link" }];
}
