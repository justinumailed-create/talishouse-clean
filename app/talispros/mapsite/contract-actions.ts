"use server";

import { cookies, headers } from "next/headers";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getLocale } from "@/lib/i18n/server";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { resolveClaimedMapSiteAccountTypeSegment } from "@/app/talispros/mapsites/actions";
import { ACTIVATE_QUERY } from "@/lib/talispros/ebook-choice";
import { loadMapSiteOwnerCustomizationsByFastCode } from "@/lib/talispros/mapsite-owner-customizations-service";
import {
  defaultMapSiteContractText,
  validateContractSignature,
  type ContractSignatureInput,
} from "@/lib/talispros/mapsite-contract";
import {
  CONTRACT_COOKIE_MAX_AGE,
  contractCookieName,
  isContractCodeActive,
  recordMapSiteContractSignature,
  redeemContractAccessCode,
  signContractCookie,
  verifyContractCookie,
} from "@/lib/talispros/mapsite-contract-service";

async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0]?.trim() || null;
  return { ip, userAgent: h.get("user-agent") };
}

/** Visitor enters the agent's access code → short-lived signed cookie for this FAST Code. */
export async function unlockMapSiteContractAction(input: {
  fastCode: string;
  code: string;
}): Promise<{ ok: true } | { error: "badCode" | "tooMany" | "notReady" }> {
  const fastCode = String(input.fastCode || "").trim().toLowerCase();
  if (!fastCode) return { error: "badCode" };
  const meta = await requestMeta();
  const result = await redeemContractAccessCode({
    fastCode,
    code: String(input.code || ""),
    ...meta,
  });
  if ("error" in result) return result;
  const store = await cookies();
  store.set(contractCookieName(fastCode), signContractCookie(fastCode, result.codeId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/talispros/mapsite/contract",
    maxAge: CONTRACT_COOKIE_MAX_AGE,
  });
  return { ok: true };
}

/** Code id from the unlock cookie, if still valid. */
export async function readUnlockedContractCodeId(fastCode: string): Promise<string | null> {
  const store = await cookies();
  const codeId = verifyContractCookie(fastCode, store.get(contractCookieName(fastCode))?.value);
  if (!codeId) return null;
  return (await isContractCodeActive(codeId, fastCode)) ? codeId : null;
}

/** Effective contract text: owner/admin text, else the localized placeholder. */
export async function loadMapSiteContractText(
  fastCode: string,
): Promise<{ text: string; isPlaceholder: boolean }> {
  const custom = await loadMapSiteOwnerCustomizationsByFastCode(fastCode);
  if (custom.contractText) return { text: custom.contractText, isPlaceholder: false };
  return { text: defaultMapSiteContractText(await getLocale(), fastCode), isPlaceholder: true };
}

/** In-app e-signature → stored record → purchase (Mapsite activation checkout). */
export async function signMapSiteContractAction(
  input: Omit<ContractSignatureInput, "locale">,
): Promise<{ redirectTo: string } | { error: string }> {
  const fastCode = String(input.fastCode || "").trim().toLowerCase();
  const codeId = fastCode ? await readUnlockedContractCodeId(fastCode) : null;
  if (!codeId) return { error: "locked" };
  const invalid = validateContractSignature(input);
  if (invalid) return { error: invalid };
  const mapsite = await getMapSiteByFastCode(fastCode).catch(() => null);
  if (!mapsite) return { error: "notFound" };
  const { text } = await loadMapSiteContractText(fastCode);
  const meta = await requestMeta();
  const email = input.signerEmail?.trim() || null;
  const saved = await recordMapSiteContractSignature({
    mapsiteId: mapsite.id,
    fastCode,
    codeId,
    signerName: input.signerName.trim(),
    signerEmail: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : null,
    signatureType: input.signatureType,
    signatureText: input.signatureType === "typed" ? input.signatureText?.trim() || null : null,
    signatureImage: input.signatureType === "drawn" ? input.signatureImage || null : null,
    contractText: text,
    locale: await getLocale(),
    ...meta,
  });
  if ("error" in saved) return saved;
  const accountType = await resolveClaimedMapSiteAccountTypeSegment({
    fastCode,
    mapsiteId: mapsite.id,
  }).catch(() => "listings");
  const base = buildClaimedMapSitePath({ fastCode, accountType });
  const sep = base.includes("?") ? "&" : "?";
  return { redirectTo: `${base}${sep}${ACTIVATE_QUERY}=1&contract=signed` };
}
