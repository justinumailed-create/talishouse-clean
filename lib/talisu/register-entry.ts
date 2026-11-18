import "server-only";
import { cookies } from "next/headers";
import {
  CONTRACT_AGENT_COOKIE,
  getContractAgentById,
  verifyCookieValue,
} from "@/lib/talispros/mapsite-contract-service";
import { PUBLIC_AGENT_CODES } from "@/lib/talisu/checkout-codes";

/**
 * Register entry gate (Arun, Oct 31): Aisha's registration (/talisu/reg
 * structure step and the SamCart checkout) only opens after the visitor
 * enters an entry code issued by an agent. The entry code is the agent's
 * permanent agent code (agent_admins.contract_code, migration 108), checked
 * server-side by redeemAgentContractCode (active agents only, rate-limited,
 * logged). A valid code sets this HMAC-signed, httpOnly cookie for 12 hours.
 */
export const REGISTER_ENTRY_COOKIE = "talisu_reg_entry";
export const REGISTER_ENTRY_COOKIE_SCOPE = "reg-entry";
export const REGISTER_ENTRY_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

/**
 * Set after a checkout allowlist code (aritri, enanko, ralf, arun, demo).
 * The cookie stores this fixed id, not the typed code. The signer only
 * accepts UUID-shaped ids.
 */
export const CHECKOUT_CODE_COOKIE = "talisu_checkout_code";
export const CHECKOUT_CODE_SCOPE = "checkout-code";
export const CHECKOUT_CODE_GRANT_ID = "c0de0000-0000-4000-8000-0000000000de";
export const CHECKOUT_CODE_MAX_AGE = REGISTER_ENTRY_COOKIE_MAX_AGE;

/** Which public agent code (Websterr or Aishaa) opened Register. */
export const PUBLIC_AGENT_COOKIE = "talisu_public_agent";
export const PUBLIC_AGENT_SCOPE = "public-agent";

/**
 * True when this browser holds a valid entry for an agent who is still
 * active: the register entry cookie, or the contract unlock cookie (the same
 * agent code, already validated on the Contract step).
 */
export async function hasRegisterEntry(): Promise<boolean> {
  const jar = await cookies();
  const agentId =
    verifyCookieValue(REGISTER_ENTRY_COOKIE_SCOPE, jar.get(REGISTER_ENTRY_COOKIE)?.value) ||
    verifyCookieValue("agent", jar.get(CONTRACT_AGENT_COOKIE)?.value);
  if (!agentId) return false;
  return Boolean(await getContractAgentById(agentId));
}

/**
 * Checkout opens only after one of the allowlist codes. Older agent,
 * contract, and admin sessions do not skip this gate.
 */
export async function hasCheckoutAccess(): Promise<boolean> {
  const jar = await cookies();
  const grant = verifyCookieValue(CHECKOUT_CODE_SCOPE, jar.get(CHECKOUT_CODE_COOKIE)?.value);
  return grant === CHECKOUT_CODE_GRANT_ID;
}

/** Ralf for Websterr, Jonathan for Aishaa, or null when no public code was used. */
export async function readPublicAgentFollowUp(): Promise<"Ralf" | "Jonathan" | null> {
  const jar = await cookies();
  const id = verifyCookieValue(PUBLIC_AGENT_SCOPE, jar.get(PUBLIC_AGENT_COOKIE)?.value);
  const match = PUBLIC_AGENT_CODES.find((item) => item.id === id);
  return match ? match.followUp : null;
}
