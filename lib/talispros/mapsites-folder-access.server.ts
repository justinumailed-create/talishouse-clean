import "server-only";

import { cookies } from "next/headers";
import {
  MAPSITES_FOLDER_COOKIE,
  mapsitesFolderCookieMatches,
  mapsitesFolderCookieValue,
  matchesMapsitesFolderCode,
} from "@/lib/talispros/mapsites-folder-code";

export async function mapsitesFoldersUnlocked(): Promise<boolean> {
  const jar = await cookies();
  return mapsitesFolderCookieMatches(jar.get(MAPSITES_FOLDER_COOKIE)?.value ?? "");
}

export async function writeMapsitesFolderCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(MAPSITES_FOLDER_COOKIE, mapsitesFolderCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export { matchesMapsitesFolderCode };
