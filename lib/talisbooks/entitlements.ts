/**
 * TalisBooks™ activation entitlements.
 *
 * Clients may create one draft without payment. Publishing, global marketing,
 * multiple books, additional uploads, bookshelves, derivative books, and Adpro
 * books stay locked until the account is activated. Quotas then unlock by
 * account type. This module does not change PayPal payment capture logic.
 */

import { TALISBOOKS_LIBRARY_SHELF_CAPACITY } from "@/lib/talisbooks/library/constants";
import type { TalisBooksAccountType } from "@/lib/talisbooks/types";
import {
  buildClaimedMapSitePath,
  mapsiteAccountTypeSegment,
} from "@/lib/talispros/mapsite-state";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export type TalisBooksAccountKind = Extract<
  TalisBooksAccountType,
  "root" | "derivative" | "adpro"
>;

export type TalisBooksEntitlementFeature =
  | "create_first_draft"
  | "create_additional_book"
  | "publish"
  | "global_marketing"
  | "additional_uploads"
  | "bookshelf"
  | "derivative_book"
  | "adpro_book";

/** Unactivated accounts may hold exactly one draft TalisBook™. */
export const TALISBOOKS_UNACTIVATED_BOOK_QUOTA = 1;

/**
 * Permitted book counts after activation, by account type.
 * Root / Derivative use the standard TEB™ shelf capacity.
 * Adpro PIN unlocks one book per PIN / MapSite shelf.
 */
export const TALISBOOKS_ACTIVATED_BOOK_QUOTAS: Record<TalisBooksAccountKind, number> =
  {
    root: TALISBOOKS_LIBRARY_SHELF_CAPACITY,
    derivative: TALISBOOKS_LIBRARY_SHELF_CAPACITY,
    adpro: 1,
  };

export type TalisBooksEntitlements = {
  activated: boolean;
  accountKind: TalisBooksAccountKind;
  bookCount: number;
  bookQuota: number;
  remainingBooks: number;
  canCreateFirstDraft: boolean;
  canCreateAdditionalBook: boolean;
  canPublish: boolean;
  canGlobalMarket: boolean;
  canAdditionalUploads: boolean;
  canUseBookshelf: boolean;
  canCreateDerivativeBook: boolean;
  canCreateAdproBook: boolean;
  lockedFeatures: TalisBooksEntitlementFeature[];
  registrationHref: string;
};

export function resolveTalisBooksAccountKind(input: {
  accountType?: string | null;
  audience?: string | null;
  marketType?: string | null;
}): TalisBooksAccountKind {
  const raw = [
    input.accountType,
    input.audience,
    input.marketType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    raw.includes("adpro") ||
    raw.includes("fsbo") ||
    raw.includes("fsbos")
  ) {
    return "adpro";
  }
  if (raw.includes("derivative")) {
    return "derivative";
  }
  return "root";
}

/**
 * Activation for TalisBooks entitlements — MapSite ACTIVE and/or
 * build_requests.activated_at. Does not call or modify payment helpers.
 */
export function isTalisBooksAccountActivated(input: {
  mapsiteStatus?: string | null;
  activatedAt?: string | null;
}): boolean {
  if (input.activatedAt && String(input.activatedAt).trim()) {
    return true;
  }
  return (input.mapsiteStatus || "").trim().toUpperCase() === "ACTIVE";
}

export function getTalisBooksBookQuota(input: {
  activated: boolean;
  accountKind: TalisBooksAccountKind;
}): number {
  if (!input.activated) {
    return TALISBOOKS_UNACTIVATED_BOOK_QUOTA;
  }
  return TALISBOOKS_ACTIVATED_BOOK_QUOTAS[input.accountKind];
}

export function evaluateTalisBooksEntitlements(input: {
  activated: boolean;
  accountKind: TalisBooksAccountKind;
  bookCount: number;
  registrationHref: string;
}): TalisBooksEntitlements {
  const bookQuota = getTalisBooksBookQuota(input);
  const bookCount = Math.max(0, input.bookCount);
  const remainingBooks = Math.max(0, bookQuota - bookCount);
  const underQuota = bookCount < bookQuota;
  const activated = input.activated;

  const canCreateFirstDraft = bookCount === 0;
  const canCreateAdditionalBook = activated && underQuota && bookCount > 0;
  const canPublish = activated;
  const canGlobalMarket = activated;
  const canAdditionalUploads = activated;
  const canUseBookshelf = activated;
  const canCreateDerivativeBook =
    activated &&
    underQuota &&
    (input.accountKind === "root" || input.accountKind === "derivative");
  const canCreateAdproBook =
    activated && underQuota && input.accountKind === "adpro";

  const lockedFeatures: TalisBooksEntitlementFeature[] = [];
  if (!canCreateFirstDraft && !canCreateAdditionalBook) {
    lockedFeatures.push("create_additional_book");
  }
  if (!canPublish) lockedFeatures.push("publish");
  if (!canGlobalMarket) lockedFeatures.push("global_marketing");
  if (!canAdditionalUploads) lockedFeatures.push("additional_uploads");
  if (!canUseBookshelf) lockedFeatures.push("bookshelf");
  if (!canCreateDerivativeBook) lockedFeatures.push("derivative_book");
  if (!canCreateAdproBook) lockedFeatures.push("adpro_book");

  return {
    activated,
    accountKind: input.accountKind,
    bookCount,
    bookQuota,
    remainingBooks,
    canCreateFirstDraft,
    canCreateAdditionalBook,
    canPublish,
    canGlobalMarket,
    canAdditionalUploads,
    canUseBookshelf,
    canCreateDerivativeBook,
    canCreateAdproBook,
    lockedFeatures,
    registrationHref: input.registrationHref,
  };
}

export function canCreateTalisBook(entitlements: TalisBooksEntitlements): boolean {
  return (
    entitlements.canCreateFirstDraft || entitlements.canCreateAdditionalBook
  );
}

export function assertTalisBooksFeature(
  entitlements: TalisBooksEntitlements,
  feature: TalisBooksEntitlementFeature,
): { ok: true } | { ok: false; error: string; registrationHref: string } {
  const href = entitlements.registrationHref;

  switch (feature) {
    case "create_first_draft":
      if (entitlements.canCreateFirstDraft) return { ok: true };
      if (entitlements.canCreateAdditionalBook) return { ok: true };
      return {
        ok: false,
        error: entitlements.activated
          ? `Book quota reached (${entitlements.bookQuota} for ${entitlements.accountKind} accounts).`
          : "Activate your account to create additional TalisBooks™.",
        registrationHref: href,
      };
    case "create_additional_book":
      if (entitlements.canCreateAdditionalBook || entitlements.canCreateFirstDraft) {
        return { ok: true };
      }
      return {
        ok: false,
        error: entitlements.activated
          ? `Book quota reached (${entitlements.bookQuota} for ${entitlements.accountKind} accounts).`
          : "Activate your account to create additional TalisBooks™.",
        registrationHref: href,
      };
    case "publish":
      if (entitlements.canPublish) return { ok: true };
      return {
        ok: false,
        error: "Publishing unlocks after account activation.",
        registrationHref: href,
      };
    case "global_marketing":
      if (entitlements.canGlobalMarket) return { ok: true };
      return {
        ok: false,
        error: "Global marketing unlocks after account activation.",
        registrationHref: href,
      };
    case "additional_uploads":
      if (entitlements.canAdditionalUploads) return { ok: true };
      return {
        ok: false,
        error: "Additional uploads unlock after account activation.",
        registrationHref: href,
      };
    case "bookshelf":
      if (entitlements.canUseBookshelf) return { ok: true };
      return {
        ok: false,
        error: "Full bookshelf features unlock after account activation.",
        registrationHref: href,
      };
    case "derivative_book":
      if (entitlements.canCreateDerivativeBook) return { ok: true };
      return {
        ok: false,
        error: entitlements.activated
          ? "Derivative books require a Root or Derivative account with available quota."
          : "Derivative books unlock after account activation.",
        registrationHref: href,
      };
    case "adpro_book":
      if (entitlements.canCreateAdproBook) return { ok: true };
      return {
        ok: false,
        error: entitlements.activated
          ? "Adpro books require an Adpro PIN account with available quota."
          : "Adpro books unlock after account activation.",
        registrationHref: href,
      };
    default:
      return { ok: false, error: "Feature is locked.", registrationHref: href };
  }
}

export async function getTalisBooksEntitlementSnapshot(
  fastCodeRaw: string,
): Promise<TalisBooksEntitlements | null> {
  const fastCode = fastCodeRaw.trim().toLowerCase();
  if (!fastCode || fastCode === "demo") return null;

  const registrationHref = buildClaimedMapSitePath({
    fastCode,
    audience: "listings",
  });

  if (!isSupabaseAdminConfigured()) {
    return evaluateTalisBooksEntitlements({
      activated: false,
      accountKind: "root",
      bookCount: 0,
      registrationHref,
    });
  }

  const supabase = getSupabaseAdmin();

  const [{ data: mapsite }, { data: codeRow }, { count: bookCount }] =
    await Promise.all([
      supabase
        .from("mapsites")
        .select("id, status, account_type, fast_code")
        .ilike("fast_code", fastCode)
        .maybeSingle(),
      supabase
        .from("fast_codes")
        .select("code, mapsite_id, request_id, account_type")
        .ilike("code", fastCode)
        .maybeSingle(),
      supabase
        .from("talisbooks_books")
        .select("id", { count: "exact", head: true })
        .ilike("fast_code", fastCode),
    ]);

  let activatedAt: string | null = null;
  let marketType: string | null = null;
  let requestAccountType: string | null = null;

  if (codeRow?.request_id) {
    const { data: request } = await supabase
      .from("build_requests")
      .select("activated_at, market_type, requested_account_type, account_type")
      .eq("id", codeRow.request_id)
      .maybeSingle();
    activatedAt = request?.activated_at ?? null;
    marketType = request?.market_type ?? null;
    requestAccountType =
      request?.requested_account_type || request?.account_type || null;
  }

  const audience = mapsiteAccountTypeSegment(
    marketType || requestAccountType || mapsite?.account_type || "listings",
  );

  const accountKind = resolveTalisBooksAccountKind({
    accountType: requestAccountType || mapsite?.account_type || codeRow?.account_type,
    audience,
    marketType,
  });

  const activated = isTalisBooksAccountActivated({
    mapsiteStatus: mapsite?.status,
    activatedAt,
  });

  return evaluateTalisBooksEntitlements({
    activated,
    accountKind,
    bookCount: bookCount ?? 0,
    registrationHref: buildClaimedMapSitePath({
      fastCode,
      audience,
    }),
  });
}
