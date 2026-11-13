"use server";

import { acceptGlobalAdminPassword } from "@/lib/talispros/prospect-gate-server";

/** Existing Global Admin password or admin grant. Opens the map and an admin session. */
export async function unlockMarketsAdminAction(input: {
  password: string;
}): Promise<{ ok: true } | { ok: false; error: "wrong" | "limited" | "failed" }> {
  return acceptGlobalAdminPassword(typeof input?.password === "string" ? input.password : "");
}
