"use server";

import { cookies, headers } from "next/headers";
import {
  redeemAgentContractCode,
  signCookieValue,
} from "@/lib/talispros/mapsite-contract-service";
import {
  REGISTER_ENTRY_COOKIE,
  REGISTER_ENTRY_COOKIE_MAX_AGE,
  REGISTER_ENTRY_COOKIE_SCOPE,
} from "@/lib/talisu/register-entry";

/** Visitor enters the entry code their agent issued → registration opens (12 h). */
export async function redeemRegisterEntryAction(input: {
  code: string;
}): Promise<{ ok: true } | { ok: false; error: "badCode" | "tooMany" | "notReady" }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  const result = await redeemAgentContractCode({
    code: typeof input?.code === "string" ? input.code : "",
    fastCode: null,
    ip,
    userAgent: h.get("user-agent"),
  });
  if ("error" in result) return { ok: false, error: result.error };
  (await cookies()).set(
    REGISTER_ENTRY_COOKIE,
    signCookieValue(REGISTER_ENTRY_COOKIE_SCOPE, result.agent.id, REGISTER_ENTRY_COOKIE_MAX_AGE),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REGISTER_ENTRY_COOKIE_MAX_AGE,
    },
  );
  return { ok: true };
}
