"use server";

import { cookies, headers } from "next/headers";
import { getLocale } from "@/lib/i18n/server";
import { findClaimedMapSite } from "@/lib/talisu/pmc-gate";
import {
  CONTRACT_AGENT_COOKIE,
  CONTRACT_AGENT_COOKIE_MAX_AGE,
  CONTRACT_SIGNED_COOKIE,
  CONTRACT_SIGNED_COOKIE_MAX_AGE,
  getContractAgentById,
  getSignedContractById,
  recordServiceAgreementSignature,
  redeemAgentContractCode,
  signCookieValue,
  verifyCookieValue,
} from "@/lib/talispros/mapsite-contract-service";
import {
  PMC_PATHS,
  normalizeFastCodeParam,
  pmcHref,
  validateContractSignature,
  type ContractSignatureInput,
} from "@/lib/talispros/mapsite-contract";
import { serviceAgreementPlainText } from "@/lib/talisu/pmc-legal";

async function requestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  return { ip, userAgent: h.get("user-agent") };
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/** Client enters their agent's permanent code → Contract unlocks (12 h). */
export async function unlockPmcContractAction(input: {
  code: string;
  fastCode?: string | null;
}): Promise<{ ok: true; agentName: string } | { ok: false; error: "badCode" | "tooMany" | "notReady" }> {
  const meta = await requestMeta();
  const result = await redeemAgentContractCode({
    code: input.code,
    fastCode: normalizeFastCodeParam(input.fastCode),
    ...meta,
  });
  if ("error" in result) return { ok: false, error: result.error };
  (await cookies()).set(
    CONTRACT_AGENT_COOKIE,
    signCookieValue("agent", result.agent.id, CONTRACT_AGENT_COOKIE_MAX_AGE),
    cookieOpts(CONTRACT_AGENT_COOKIE_MAX_AGE),
  );
  return { ok: true, agentName: result.agent.name };
}

export async function clearPmcContractAgentAction(): Promise<void> {
  (await cookies()).delete(CONTRACT_AGENT_COOKIE);
}

export async function readUnlockedContractAgent() {
  const id = verifyCookieValue("agent", (await cookies()).get(CONTRACT_AGENT_COOKIE)?.value);
  return id ? getContractAgentById(id) : null;
}

export async function readSignedContractId(): Promise<string | null> {
  return verifyCookieValue("signed", (await cookies()).get(CONTRACT_SIGNED_COOKIE)?.value);
}

/** Sign the Service Agreement → attribute to the agent → go to Register (Aisha). */
export async function signPmcContractAction(
  input: ContractSignatureInput,
): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  const invalid = validateContractSignature(input);
  if (invalid) return { ok: false, error: invalid };

  // FAST Code required: must be the visitor's claimed (non-demo) Mapsite.
  const claimed = await findClaimedMapSite(normalizeFastCodeParam(input.fastCode));
  if (!claimed) return { ok: false, error: "needFastCode" };
  const fastCode = claimed.fastCode;
  const mapsiteId: string | null = claimed.id;
  // Already signed by THIS browser for this FAST Code → just continue. Another
  // visitor's signature on file never blocks or stands in for this signer:
  // they record their own (insert only; existing records are never changed).
  const ownId = await readSignedContractId();
  const own = ownId ? await getSignedContractById(ownId) : null;
  if (own && own.fastCode?.toLowerCase() === fastCode.toLowerCase()) {
    return { ok: true, href: pmcHref(PMC_PATHS.register, { fastCode }) };
  }
  const email = input.signerEmail?.trim() || null;
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { ok: false, error: "badEmail" };
  }
  const agent = await readUnlockedContractAgent();
  if (!agent) return { ok: false, error: "locked" };
  const meta = await requestMeta();
  const result = await recordServiceAgreementSignature({
    mapsiteId,
    fastCode,
    agent,
    signerName: input.signerName.trim(),
    signerBusiness: input.signerBusiness?.trim().slice(0, 200) || null,
    signerEmail: email,
    signatureType: input.signatureType,
    signatureText: input.signatureType === "typed" ? input.signatureText?.trim() || null : null,
    signatureImage: input.signatureType === "drawn" ? input.signatureImage ?? null : null,
    contractText: serviceAgreementPlainText(),
    locale: await getLocale(),
    ...meta,
  });
  if ("error" in result) return { ok: false, error: result.error };
  const jar = await cookies();
  jar.set(
    CONTRACT_SIGNED_COOKIE,
    signCookieValue("signed", result.id, CONTRACT_SIGNED_COOKIE_MAX_AGE),
    cookieOpts(CONTRACT_SIGNED_COOKIE_MAX_AGE),
  );
  return { ok: true, href: pmcHref(PMC_PATHS.register, { fastCode }) };
}
