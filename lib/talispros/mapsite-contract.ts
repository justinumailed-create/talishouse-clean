/**
 * PMC contract (pure helpers — safe for client + server).
 *
 * Sequence (TalisU dropdown, below the divider):
 *   /talisu/talispros → /talisu/media-directory → /talisu/contract → /talisu/reg
 *
 * The Contract (Service Agreement) is unlocked with the client's agent's
 * permanent agent code (agent_admins.contract_code, migration 108). The
 * signature is captured in-app (typed or drawn) and attributed to that agent.
 * DocuSign is not wired (no credentials); `provider = 'in-app'`.
 */

export const PMC_PATHS = {
  talispros: "/talisu/talispros",
  mediaDirectory: "/talisu/media-directory",
  contract: "/talisu/contract",
  register: "/talisu/reg",
  terms: "/talisu/terms",
  privacy: "/talisu/privacy",
} as const;

export const TALISWEBS_US_URL = "https://www.taliswebs.com";

/** Keep the client's FAST Code (and agent code) across the sequence. */
export function pmcHref(
  path: string,
  params: { fastCode?: string | null; agent?: string | null } = {},
): string {
  const q = new URLSearchParams();
  const fc = normalizeFastCodeParam(params.fastCode);
  if (fc) q.set("fastCode", fc);
  const agent = normalizeAgentCode(params.agent ?? "");
  if (agent) q.set("agent", agent);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export function normalizeFastCodeParam(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return /^[a-z0-9-]{2,32}$/.test(v) ? v : null;
}

/** Agent codes look like TP-XXXXXX (alphabet without 0/O/1/I/L). */
export const AGENT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeAgentCode(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("TP") ? raw.slice(2) : raw;
  if (body.length !== 6 || ![...body].every((c) => AGENT_CODE_ALPHABET.includes(c))) {
    return "";
  }
  return `TP-${body}`;
}

export type ContractSignatureInput = {
  signerName: string;
  signerBusiness?: string | null;
  signerEmail?: string | null;
  /** Required: the claimed Mapsite's FAST Code. */
  fastCode: string;
  signatureType: "typed" | "drawn";
  signatureText?: string | null;
  signatureImage?: string | null;
  consent: boolean;
};

export function isValidSignatureImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/png;base64,") &&
    value.length > 200 &&
    value.length < 400_000
  );
}

export function validateContractSignature(
  input: ContractSignatureInput,
): "needFastCode" | "needName" | "needSignature" | "needConsent" | null {
  if (!normalizeFastCodeParam(input.fastCode)) return "needFastCode";
  const name = input.signerName?.trim() || "";
  if (name.length < 2 || name.length > 120) return "needName";
  if (input.signatureType === "typed") {
    if ((input.signatureText?.trim() || "").length < 2) return "needSignature";
  } else if (input.signatureType === "drawn") {
    if (!isValidSignatureImage(input.signatureImage)) return "needSignature";
  } else {
    return "needSignature";
  }
  if (!input.consent) return "needConsent";
  return null;
}
