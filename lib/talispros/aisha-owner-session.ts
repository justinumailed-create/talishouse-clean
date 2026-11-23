import { cookies } from "next/headers";
import { CLIENT_ANALYTICS_COOKIE } from "@/lib/client-analytics-auth";
import {
  MAPSITE_OWNER_COOKIE,
  MAPSITE_ROOT_ACCOUNT_COOKIE,
} from "@/lib/mapsite-account-session";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseReadClient } from "@/lib/supabaseClient";
import { connectedBookshelfPath } from "@/lib/talisbooks/bookshelf/lock";
import { AISHA_HOMEPAGE_AGENT_ID } from "@/lib/talispros/aisha-mapsite-agent";
import { loadMapSitePinDashboard } from "@/lib/talispros/mapsite-additional-pins-service";
import { toShareableAbsoluteUrl } from "@/lib/talispros/mapsite-state";

export const AISHA_NOT_SIGNED_IN = "not signed in";

/**
 * ElevenLabs dynamic variables for the homepage Aisha agent.
 * Every value is a string. Empty means "nothing to say".
 */
export type AishaCallVariables = {
  signed_in: "yes" | "no";
  first_name: string;
  fast_codes: string;
  mapsite_urls: string;
  home_urls: string;
  pin_count: string;
  pin_allowance: string;
  pin_summary: string;
  bookshelf_urls: string;
  extra_pin_url: string;
};

export type AishaOwnedMapsite = {
  fastCode: string;
  firstName: string;
  pinCount: number;
  pinAllowance: number;
};

const CODE = /^[a-z0-9-]{2,64}$/;

export function aishaAnonymousVariables(): AishaCallVariables {
  return {
    signed_in: "no",
    first_name: AISHA_NOT_SIGNED_IN,
    fast_codes: "",
    mapsite_urls: "",
    home_urls: "",
    pin_count: "",
    pin_allowance: "",
    pin_summary: "",
    bookshelf_urls: "",
    extra_pin_url: "",
  };
}

export function aishaOwnerVariables(
  mapsites: readonly AishaOwnedMapsite[],
  origin?: string | null,
): AishaCallVariables {
  const rows = mapsites.filter((row) => CODE.test(row.fastCode.trim().toLowerCase()));
  if (rows.length === 0) return aishaAnonymousVariables();
  const first =
    rows.find((row) => row.firstName.trim())?.firstName.trim().split(/\s+/)[0] || AISHA_NOT_SIGNED_IN;
  const codes = rows.map((row) => row.fastCode.trim().toLowerCase());
  const abs = (path: string) => toShareableAbsoluteUrl(path, origin);
  const pinCount = rows.reduce((sum, row) => sum + Math.max(0, Math.trunc(row.pinCount) || 0), 0);
  const pinAllowance = rows.reduce(
    (sum, row) => sum + Math.max(0, Math.trunc(row.pinAllowance) || 0),
    0,
  );
  return {
    signed_in: "yes",
    first_name: first,
    fast_codes: codes.join(", "),
    mapsite_urls: codes.map((code) => abs(`/map/${code}`)).join(", "),
    home_urls: codes.map((code) => abs(`/home/${code}`)).join(", "),
    pin_count: String(pinCount),
    pin_allowance: String(pinAllowance),
    pin_summary: rows
      .map(
        (row) =>
          `${row.fastCode.trim().toLowerCase()}: ${Math.max(0, Math.trunc(row.pinCount) || 0)} of ${Math.max(0, Math.trunc(row.pinAllowance) || 0)}`,
      )
      .join("; "),
    bookshelf_urls: codes.map((code) => abs(connectedBookshelfPath(code))).join(", "),
    extra_pin_url: abs(`/map/${codes[0]}#additional-pins`),
  };
}

export function serializeAishaVariables(vars: AishaCallVariables): string {
  return JSON.stringify(vars).replace(/</g, "\\u003c");
}

/** The Mapsite widget keeps its own variables unless it is the homepage agent. */
export async function mapsiteAishaVariables(
  agentId: string,
  mapsiteVariables: string,
): Promise<string> {
  if (agentId !== AISHA_HOMEPAGE_AGENT_ID) return mapsiteVariables;
  return loadAishaCallVariables();
}

/** The Mapsite widget keeps its own variables unless it is the homepage agent. */
export function aishaVariablesForAgent(
  agentId: string,
  mapsiteVariables: string,
  sessionVariables: string,
): string {
  return agentId === AISHA_HOMEPAGE_AGENT_ID ? sessionVariables : mapsiteVariables;
}

export async function readOwnerSessionFastCodes(): Promise<string[]> {
  const jar = await cookies();
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const value of [
    jar.get(MAPSITE_OWNER_COOKIE)?.value,
    jar.get(MAPSITE_ROOT_ACCOUNT_COOKIE)?.value,
    jar.get(CLIENT_ANALYTICS_COOKIE)?.value,
  ]) {
    const code = value?.trim().toLowerCase() || "";
    if (!CODE.test(code) || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

async function siblingFastCodes(email: string, known: Set<string>): Promise<string[]> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes("@")) return [];
  const client = getSupabaseReadClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("mapsites")
      .select("fast_code")
      .ilike("email", address)
      .limit(12);
    if (error || !data) return [];
    return data
      .map((row) => row.fast_code?.trim().toLowerCase() || "")
      .filter((code) => CODE.test(code) && !known.has(code));
  } catch {
    return [];
  }
}

/**
 * Variables for Aisha's call. Built from the owner session cookies only.
 * A missing or unknown session is the anonymous set, with no FAST Code.
 */
export async function loadAishaCallVariables(): Promise<string> {
  const sessionCodes = await readOwnerSessionFastCodes();
  if (sessionCodes.length === 0) return serializeAishaVariables(aishaAnonymousVariables());

  const ordered: string[] = [];
  const seen = new Set<string>();
  let email = "";
  for (const code of sessionCodes) {
    if (seen.has(code)) continue;
    seen.add(code);
    ordered.push(code);
    if (email) continue;
    const mapsite = await getMapSiteByFastCode(code);
    email = mapsite?.email?.trim() || "";
  }
  for (const code of await siblingFastCodes(email, seen)) {
    seen.add(code);
    ordered.push(code);
  }

  // Load every Mapsite at once, not one after another, so a signed-in
  // owner with several FAST Codes does not wait for each lookup in turn
  // before Aisha's page can open (Ralf, Nov 19: "takes forever to load").
  const loaded = await Promise.all(
    ordered.map(async (code): Promise<AishaOwnedMapsite | null> => {
      const mapsite = await getMapSiteByFastCode(code);
      if (!mapsite?.fastCode) return null;
      const dashboard = mapsite.id ? await loadMapSitePinDashboard(mapsite.id) : null;
      const placed = mapsite.pins?.length ?? dashboard?.placedPins ?? 0;
      return {
        fastCode: mapsite.fastCode,
        firstName: mapsite.ownerFirstName?.trim() || "",
        pinCount: placed,
        pinAllowance: dashboard?.pinQuota ?? placed,
      };
    }),
  );
  const rows = loaded.filter((row): row is AishaOwnedMapsite => row !== null);
  return serializeAishaVariables(aishaOwnerVariables(rows));
}
