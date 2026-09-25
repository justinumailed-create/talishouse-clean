"use server";

import { cookies } from "next/headers";
import { requireAdminSession } from "@/lib/admin-auth";
import { ISOLATED_BOOKSHELF_UNLOCK_COOKIE } from "@/lib/talisbooks/isolated-bookshelf";

/** Marks the admin session as having completed self-serve for the isolated shelf. */
export async function unlockIsolatedBookshelfAction(): Promise<{ ok: true }> {
  await requireAdminSession();
  const store = await cookies();
  store.set(ISOLATED_BOOKSHELF_UNLOCK_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}
