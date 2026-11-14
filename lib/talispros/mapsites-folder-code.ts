import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Folder access for the Mapsites FAST Code folders.
 * Imported only from the server action and its cookie check.
 * Override with MAPSITES_FOLDER_ACCESS_CODE.
 */
const DEFAULT_MAPSITES_FOLDER_CODE = "Wsweptt";

export const MAPSITES_FOLDER_COOKIE = "mapsites_week_folders";

export function mapsitesFolderAccessCode(): string {
  const fromEnv = process.env.MAPSITES_FOLDER_ACCESS_CODE;
  return typeof fromEnv === "string" && fromEnv.length > 0
    ? fromEnv
    : DEFAULT_MAPSITES_FOLDER_CODE;
}

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Exact match after trimming. Case is significant. */
export function matchesMapsitesFolderCode(input: string): boolean {
  if (typeof input !== "string") return false;
  return sameText(input.trim(), mapsitesFolderAccessCode());
}

export function mapsitesFolderCookieValue(): string {
  return createHmac("sha256", mapsitesFolderAccessCode())
    .update("mapsites-folders-v1")
    .digest("hex");
}

export function mapsitesFolderCookieMatches(value: string): boolean {
  return value.length > 0 && sameText(value, mapsitesFolderCookieValue());
}
