"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  canLinkMapSitePartners,
  deleteMapSitePartnerLink,
  insertMapSitePartnerLink,
  normalizePartnerFastCode,
} from "@/lib/talispros/mapsite-partner-links";

async function requireSuperadmin() {
  const account = await getAdminSessionAccount();
  if (!account || !canLinkMapSitePartners(account)) return null;
  return account;
}

export async function linkMapSitePartnersAction(
  codeA: string,
  codeB: string,
): Promise<{ ok: boolean; error?: string }> {
  const account = await requireSuperadmin();
  if (!account) return { ok: false, error: "You do not have permission to link Mapsites." };
  const a = normalizePartnerFastCode(codeA);
  const b = normalizePartnerFastCode(codeB);
  if (!/^[a-z0-9-]+$/.test(a) || !/^[a-z0-9-]+$/.test(b)) {
    return { ok: false, error: "FAST Codes use letters, digits and hyphens only." };
  }
  const [ma, mb] = await Promise.all([getMapSiteByFastCode(a), getMapSiteByFastCode(b)]);
  if (!ma) return { ok: false, error: `No Mapsite found for ${a.toUpperCase()}.` };
  if (!mb) return { ok: false, error: `No Mapsite found for ${b.toUpperCase()}.` };
  const result = await insertMapSitePartnerLink(a, b, account.fastCode || account.name);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/admin/mapsites");
  return { ok: true };
}

export async function unlinkMapSitePartnersAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const account = await requireSuperadmin();
  if (!account) return { ok: false, error: "You do not have permission to unlink Mapsites." };
  const result = await deleteMapSitePartnerLink(id);
  if (result.ok) revalidatePath("/admin/mapsites");
  return result;
}
