"use server";

import { revalidatePath } from "next/cache";
import { isAllowedOwnerImageUrl } from "@/lib/talispros/mapsite-owner-customizations";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { listMapSiteAdditionalPins } from "@/lib/talispros/mapsite-additional-pins-service";
import { personalHomeMapsiteHref } from "@/lib/talispros/personal-home-page";
import {
  PERSONAL_HOME_LIMITS,
  cleanPersonalHomeText,
  invalidPersonalHomeButtons,
  normalizePersonalHomeButtons,
  personalHomePath,
  type PersonalHomeButtonContext,
  type PersonalHomeContent,
} from "@/lib/talispros/personal-home";
import {
  findMapSiteIdentityByFastCode,
  resetPersonalHomeContent,
  savePersonalHomeContent,
} from "@/lib/talispros/personal-home-service";
import { canEditPersonalHome } from "@/lib/talispros/personal-home-page";

export type PersonalHomeActionError = "auth" | "buttons" | "photo" | "save";

export type PersonalHomeActionResult =
  | { ok: true; content: PersonalHomeContent | null }
  | { ok: false; error: PersonalHomeActionError; invalidButtons?: number[] };

async function buttonContext(mapsiteId: string, fastCode: string): Promise<PersonalHomeButtonContext> {
  const view = await getMapSiteByFastCode(fastCode).catch(() => null);
  const extra = await listMapSiteAdditionalPins(mapsiteId).catch(() => []);
  return {
    mapsiteHref: view ? await personalHomeMapsiteHref(view) : personalHomePath(fastCode),
    bookshelfHref: `/talisbooks/fast/${encodeURIComponent(fastCode)}`,
    tebHref: view?.tebUrl?.trim() || null,
    pinIds: [mapsiteId, ...extra.map((pin) => pin.id)],
  };
}

async function authorize(fastCode: string) {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !(await canEditPersonalHome(code))) return null;
  const identity = await findMapSiteIdentityByFastCode(code);
  if (!identity || identity.isDemonstration) return null;
  return identity;
}

/** Owner-only save of the personal home page (photo, write-up, buttons). */
export async function savePersonalHomeAction(input: {
  fastCode: string;
  imageUrl?: string | null;
  kicker?: string | null;
  headline?: string | null;
  contactName?: string | null;
  writeUp?: string | null;
  buttons?: Array<{ label?: string; href?: string; kind?: string; pinId?: string }> | null;
}): Promise<PersonalHomeActionResult> {
  const identity = await authorize(input.fastCode);
  if (!identity) return { ok: false, error: "auth" };
  const context = await buttonContext(identity.id, identity.fastCode);

  const imageUrl = input.imageUrl?.trim() || null;
  if (imageUrl && !isAllowedOwnerImageUrl(imageUrl, process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return { ok: false, error: "photo" };
  }

  const rawButtons = Array.isArray(input.buttons) ? input.buttons : [];
  const invalidButtons = invalidPersonalHomeButtons(rawButtons, context);
  if (invalidButtons.length) {
    return { ok: false, error: "buttons", invalidButtons };
  }

  const result = await savePersonalHomeContent({
    mapsiteId: identity.id,
    fastCode: identity.fastCode,
    imageUrl,
    kicker: cleanPersonalHomeText(input.kicker, PERSONAL_HOME_LIMITS.kicker),
    headline: cleanPersonalHomeText(input.headline, PERSONAL_HOME_LIMITS.headline),
    contactName: cleanPersonalHomeText(input.contactName, PERSONAL_HOME_LIMITS.contactName),
    writeUp: cleanPersonalHomeText(input.writeUp, PERSONAL_HOME_LIMITS.writeUp, {
      multiline: true,
    }),
    buttons: normalizePersonalHomeButtons(rawButtons, context),
  });
  if (result.error || !result.content) return { ok: false, error: "save" };

  revalidatePath(personalHomePath(identity.fastCode));
  return { ok: true, content: result.content };
}

/** Owner-only: drop saved content so the Mapsite defaults show again. */
export async function resetPersonalHomeAction(input: {
  fastCode: string;
}): Promise<PersonalHomeActionResult> {
  const identity = await authorize(input.fastCode);
  if (!identity) return { ok: false, error: "auth" };
  const result = await resetPersonalHomeContent(identity.id);
  if (!result.ok) return { ok: false, error: "save" };
  revalidatePath(personalHomePath(identity.fastCode));
  return { ok: true, content: null };
}
