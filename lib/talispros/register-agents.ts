/**
 * Post–Root Account™ PayPal success: register agents (Derivative Accounts™)
 * under the newly activated Root FAST Code.
 */

import { isRootLikeClaimAccountType } from "@/lib/registration-plans";
import {
  buildClaimedMapSitePath,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";

export const REGISTER_AGENTS_PATH = "/talispros/register-agents";

export function buildRegisterAgentsHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  audience?: string | null;
  requestId?: string | null;
}): string {
  const params = new URLSearchParams();
  const fastCode = options.fastCode?.trim();
  const mapsiteId = options.mapsiteId?.trim();
  const audience = options.audience?.trim();
  const requestId = options.requestId?.trim();

  if (fastCode) params.set("fastCode", fastCode);
  if (mapsiteId) params.set("mapsiteId", mapsiteId);
  if (audience) params.set("audience", audience);
  if (requestId) params.set("requestId", requestId);

  const query = params.toString();
  return query ? `${REGISTER_AGENTS_PATH}?${query}` : REGISTER_AGENTS_PATH;
}

/** Open Derivative Account™ registration with this Root as sponsor. */
export function buildRegisterAgentUnderRootHref(fastCode: string | null | undefined): string {
  const code = fastCode?.trim();
  if (!code) {
    return "/talispros/register?plan=derivative";
  }
  return `/talispros/register?plan=derivative&sponsor=${encodeURIComponent(code)}`;
}

/** Root / Broker accounts license Derivative agents after payment. FSBO does not. */
export function shouldRegisterAgentsAfterPayment(options: {
  audience?: string | null;
  accountType?: string | null;
}): boolean {
  const audience = options.audience?.trim().toLowerCase();
  if (audience === "brokers") return true;
  if (options.accountType && isRootLikeClaimAccountType(options.accountType)) {
    return true;
  }
  return false;
}

export function postMapSitePaymentRedirectHref(options: {
  audience?: string | null;
  accountType?: string | null;
  fastCode?: string | null;
  mapsiteId?: string | null;
  requestId?: string | null;
}): string {
  if (shouldRegisterAgentsAfterPayment(options)) {
    return buildRegisterAgentsHref(options);
  }

  const fastCode = options.fastCode?.trim() || "";
  const params = new URLSearchParams({ view: "pin" });
  if (options.requestId?.trim()) params.set("requestId", options.requestId.trim());
  if (options.mapsiteId?.trim()) params.set("mapsiteId", options.mapsiteId.trim());

  if (fastCode && fastCode.toLowerCase() !== "demo") {
    return `${buildClaimedMapSitePath({
      fastCode,
      audience: options.audience,
    })}?${params.toString()}`;
  }

  params.set("claimed", "1");
  if (fastCode) params.set("fastCode", fastCode);
  if (options.audience?.trim()) params.set("audience", options.audience.trim());
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}
