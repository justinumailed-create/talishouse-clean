"use server";

import { revalidatePath } from "next/cache";
import { canManageMapSitePins, isOwnMapSite } from "@/lib/mapsite-edit-auth";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { readMapSiteForPinPurchase } from "@/lib/talispros/mapsite-additional-pins-service";
import { parsePinCategory } from "@/lib/talispros/mapsite-pin-categories";
import {
  addRootPartnerLink,
  loadEffectiveCustomPinCategories,
  loadMapSiteRootContext,
  removeRootPartnerLink,
  saveMainPinCategory,
  saveOwnCustomPinCategories,
  type MapSiteRootContext,
} from "@/lib/talispros/mapsite-root-partners-service";

type Result = { context: MapSiteRootContext; error?: undefined } | { error: string };

function revalidate(fastCodes: string[]) {
  revalidatePath("/talispros/mapsite", "layout");
  for (const code of fastCodes) {
    if (code) revalidatePath(`/mapsite/${code.trim().toLowerCase()}`);
  }
}

/** Owner (paid) / Mapsite admin / agent with PIN rights, and the id matches the code. */
async function authorize(input: { mapsiteId: string; fastCode: string }) {
  const fastCode = input.fastCode.trim();
  if (!fastCode || !(await canManageMapSitePins(fastCode))) {
    return { error: "Only the Mapsite owner can change this." } as const;
  }
  const mapsite = await readMapSiteForPinPurchase(input.mapsiteId);
  if (!mapsite || mapsite.fastCode.trim().toLowerCase() !== fastCode.toLowerCase()) {
    return { error: "FAST Code™ does not match this Mapsite." } as const;
  }
  return { fastCode, mapsiteId: mapsite.id } as const;
}

async function actorLabel(fastCode: string): Promise<string> {
  if (await isOwnMapSite(fastCode)) return `owner (${fastCode.toUpperCase()})`;
  const account = await getAdminSessionAccount();
  return account ? `${account.name} (${account.fastCode})` : "owner";
}

async function rootOnly(auth: { fastCode: string; mapsiteId: string }) {
  const context = await loadMapSiteRootContext(auth);
  // Owners and admins alike: only a Root Account's Mapsite licenses Derivatives.
  if (context.role !== "root") {
    return { error: "Only a Root Account can manage Partner Mapsites." } as const;
  }
  return { context } as const;
}

export async function addMapSitePartner(input: {
  mapsiteId: string;
  fastCode: string;
  partnerFastCode: string;
}): Promise<Result> {
  const auth = await authorize(input);
  if ("error" in auth) return { error: auth.error as string };
  const gate = await rootOnly(auth);
  if ("error" in gate) return { error: gate.error as string };
  const added = await addRootPartnerLink({
    rootFastCode: auth.fastCode,
    candidateFastCode: input.partnerFastCode,
    createdBy: await actorLabel(auth.fastCode),
  });
  if (!added.ok) return { error: added.error };
  revalidate([auth.fastCode, input.partnerFastCode]);
  return { context: await loadMapSiteRootContext(auth) };
}

export async function removeMapSitePartner(input: {
  mapsiteId: string;
  fastCode: string;
  linkId: string;
}): Promise<Result> {
  const auth = await authorize(input);
  if ("error" in auth) return { error: auth.error as string };
  const gate = await rootOnly(auth);
  if ("error" in gate) return { error: gate.error as string };
  const partner = gate.context.partners.find((p) => p.linkId === input.linkId);
  const removed = await removeRootPartnerLink({ rootFastCode: auth.fastCode, linkId: input.linkId });
  if (!removed.ok) return { error: removed.error || "Could not remove that Partner Mapsite." };
  revalidate([auth.fastCode, partner?.fastCode || ""]);
  return { context: await loadMapSiteRootContext(auth) };
}

export async function saveMapSiteCustomPinCategories(input: {
  mapsiteId: string;
  fastCode: string;
  categories: string[];
}): Promise<Result> {
  const auth = await authorize(input);
  if ("error" in auth) return { error: auth.error as string };
  const context = await loadMapSiteRootContext(auth);
  if (context.rootFastCode) {
    return {
      error: `Categories come from your Root Account (${context.rootFastCode.toUpperCase()}).`,
    };
  }
  const saved = await saveOwnCustomPinCategories({
    mapsiteId: auth.mapsiteId,
    fastCode: auth.fastCode,
    categories: Array.isArray(input.categories) ? input.categories : [],
  });
  if (!saved.ok) return { error: saved.error };
  revalidate([auth.fastCode, ...context.partners.map((p) => p.fastCode)]);
  return { context: await loadMapSiteRootContext(auth) };
}

export async function setMapSiteMainPinCategory(input: {
  mapsiteId: string;
  fastCode: string;
  category: string | null;
}): Promise<Result> {
  const auth = await authorize(input);
  if ("error" in auth) return { error: auth.error as string };
  const { categories } = await loadEffectiveCustomPinCategories(auth);
  const category = parsePinCategory(input.category, categories);
  if (category === undefined) return { error: "Choose one of the listed categories." };
  const saved = await saveMainPinCategory({ mapsiteId: auth.mapsiteId, category });
  if (!saved.ok) return { error: saved.error || "Could not save the category." };
  revalidate([auth.fastCode]);
  return { context: await loadMapSiteRootContext(auth) };
}
