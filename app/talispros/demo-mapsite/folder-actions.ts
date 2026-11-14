"use server";

import {
  matchesMapsitesFolderCode,
  writeMapsitesFolderCookie,
} from "@/lib/talispros/mapsites-folder-access.server";

export async function unlockMapsitesFoldersAction(
  code: string,
): Promise<{ ok: true } | { ok: false }> {
  if (!matchesMapsitesFolderCode(code)) return { ok: false };
  await writeMapsitesFolderCookie();
  return { ok: true };
}
