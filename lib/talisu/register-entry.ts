import "server-only";
import { cookies } from "next/headers";
import {
  CONTRACT_AGENT_COOKIE,
  getContractAgentById,
  verifyCookieValue,
} from "@/lib/talispros/mapsite-contract-service";

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
