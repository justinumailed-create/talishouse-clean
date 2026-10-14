/**
 * Mapsite contract (pure helpers — safe for client + server).
 *
 * The contract page (/talispros/mapsite/contract/{fastCode}) is gated by an
 * access code that an agent (or the Global Admin) generates in the agent
 * dashboard. After an in-app electronic signature the visitor is sent to the
 * existing Mapsite activation purchase (Stripe checkout, CAD).
 *
 * DocuSign: not wired yet (no credentials). The signing step is isolated in
 * `recordMapSiteContractSignature` (`provider = 'in-app'`) so a DocuSign
 * envelope flow can replace it later without changing the page or the codes.
 */
import type { Locale } from "@/lib/i18n/config";

export const MAPSITE_CONTRACT_BASE_PATH = "/talispros/mapsite/contract";

/** Unambiguous alphabet (no 0/O/1/I/L). */
export const CONTRACT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CONTRACT_CODE_LENGTH = 8;
export const CONTRACT_CODE_DEFAULT_DAYS = 30;
export const CONTRACT_CODE_MAX_DAYS = 365;

export function mapsiteContractPath(fastCode: string): string {
  return `${MAPSITE_CONTRACT_BASE_PATH}/${encodeURIComponent(fastCode.trim().toLowerCase())}`;
}

/** Uppercase, strip spaces / dashes (codes are shown as XXXX-XXXX). */
export function normalizeContractCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}

export function formatContractCode(code: string): string {
  const c = normalizeContractCode(code);
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

export function isContractCodeShape(value: string): boolean {
  const c = normalizeContractCode(value);
  return (
    c.length === CONTRACT_CODE_LENGTH &&
    [...c].every((ch) => CONTRACT_CODE_ALPHABET.includes(ch))
  );
}

export function clampContractDays(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return CONTRACT_CODE_DEFAULT_DAYS;
  return Math.min(CONTRACT_CODE_MAX_DAYS, n);
}

/** Placeholder until the owner / admin pastes the real agreement. */
export function defaultMapSiteContractText(locale: Locale, fastCode: string): string {
  const code = fastCode.trim().toUpperCase();
  if (locale === "de") {
    return [
      `Mapsite-Vereinbarung — FAST Code ${code}`,
      "",
      "PLATZHALTER. Dieser Text wird durch die endgültige Vereinbarung ersetzt, die der Mapsite-Inhaber oder der Talispros-Admin im Logo- & Karten-Editor einfügt.",
      "",
      "1. Parteien. Diese Vereinbarung wird zwischen dem unten unterzeichnenden Kunden und dem Inhaber dieser Mapsite geschlossen.",
      "2. Leistung. Aktivierung und Betrieb der Mapsite für den oben genannten FAST Code.",
      "3. Preis. Alle Beträge in CAD, wie im anschließenden Kaufschritt angezeigt.",
      "4. Elektronische Unterschrift. Die Parteien vereinbaren, dass diese Vereinbarung elektronisch unterschrieben werden kann.",
    ].join("\n");
  }
  return [
    `Mapsite Agreement — FAST Code ${code}`,
    "",
    "PLACEHOLDER. This text will be replaced by the final agreement that the Mapsite owner or the Talispros admin pastes into the Logo & Card Editor.",
    "",
    "1. Parties. This agreement is made between the client signing below and the owner of this Mapsite.",
    "2. Service. Activation and operation of the Mapsite for the FAST Code above.",
    "3. Price. All amounts in CAD, as shown in the purchase step that follows.",
    "4. Electronic signature. The parties agree this agreement may be signed electronically.",
  ].join("\n");
}

export type ContractSignatureInput = {
  fastCode: string;
  signerName: string;
  signerEmail?: string | null;
  signatureType: "typed" | "drawn";
  /** Typed: the signer's typed name. */
  signatureText?: string | null;
  /** Drawn: PNG data URL from the signature pad. */
  signatureImage?: string | null;
  consent: boolean;
  locale?: Locale;
};

/** PNG data URL from the pad, bounded (≈300 KB). */
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
): "needName" | "needSignature" | "needConsent" | null {
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
