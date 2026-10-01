/**
 * Convert a demonstration Mapsite™ into a live claimed Mapsite™ with an
 * issued FAST Code™ — same initials+digits rules as Claim a Market™ / build.
 */

import type { Database } from "@/lib/database.types";
import {
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
} from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/services/fast-code.service";
import { FastCodeValidationError } from "@/validators/fast-code.validator";
import {
  DEMO_PINNED_EBOOK_HREF,
  isDemonstrationListing,
  isProtectedPlatformDemoMapSite,
} from "@/lib/talispros/demo-mapsite";
import {
  buildClaimedMapSitePath,
  claimedMapSiteSegmentForAccountOrPlan,
  DEMO_MAPSITE_FAST_CODE,
} from "@/lib/talispros/mapsite-state";
import { accountTypeForAudience } from "@/lib/talispros/account-capabilities";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { mapsiteUrlGatePath } from "@/lib/talispros/mapsite-url-gate";
import { ROUTES } from "@/lib/routes";

export type ClaimDemoMapSiteInput = {
  mapsiteId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email?: string | null;
  /** Capability account type (root / derivative / fsbo / adpro). */
  accountType?: string | null;
  /** /start audience (brokers | listings | fsbos | adpro). Wins over accountType for path. */
  audience?: string | null;
};

export type ClaimDemoMapSiteResult =
  | {
      ok: true;
      mapsiteId: string;
      fastCode: string;
      href: string;
      accountTypeSegment: string;
      tebHref: string;
    }
  | { ok: false; error: string };

const MAPSITE_SELECT =
  "id, fast_code, status, latitude, longitude, map_zoom, property_title, property_address, property_description, cover_image, header_image_url, logo_url, profile_image_url, agent_name, owner_first_name, owner_last_name, gallery_images, mls_url, broker_url, website, teb_url, ttv_url, account_type, is_demonstration, email, phone";

function isDemoPlaceholderTitle(title: string | null | undefined): boolean {
  const raw = title?.trim() || "";
  if (!raw) return true;
  return /^demo(\s|$)/i.test(raw) || /mapsite/i.test(raw);
}

/** Demo builder default copy — must not survive on an issued claimed Mapsite™. */
function isDemoNotIssuedDescription(value: string | null | undefined): boolean {
  const text = value?.trim() || "";
  if (!text) return true;
  return (
    /no fast code is issued/i.test(text) ||
    /^demonstration mapsite/i.test(text)
  );
}

function resolveClaimedDescription(
  raw: string | null | undefined,
  propertyAddress: string | null,
): string {
  if (!isDemoNotIssuedDescription(raw)) {
    return raw!.trim();
  }
  if (propertyAddress) {
    return `Claimed Mapsite™ · FAST Code™ issued for ${propertyAddress}.`;
  }
  return "Claimed Mapsite™ · FAST Code™ issued.";
}

function resolveClaimedBookTitle(
  currentTitle: string | null | undefined,
  propertyTitle: string,
  propertyAddress: string | null,
  fastCode: string,
): string {
  const title = currentTitle?.trim() || "";
  if (title && !isDemoPlaceholderTitle(title) && !/^demo\b/i.test(title)) {
    return title;
  }
  if (propertyTitle && !isDemoPlaceholderTitle(propertyTitle)) {
    return propertyTitle;
  }
  if (propertyAddress) return propertyAddress;
  return `Talisbook™ · ${fastCode.trim().toUpperCase()}`;
}

function resolveClaimAccountType(input: ClaimDemoMapSiteInput): {
  accountTypeRaw: string;
  accountTypeSegment: string;
} {
  const audience =
    parseRegistrationMarket(input.audience) ||
    parseRegistrationMarket(input.accountType);
  if (audience) {
    return {
      accountTypeRaw: accountTypeForAudience(audience),
      accountTypeSegment: claimedMapSiteSegmentForAccountOrPlan(audience),
    };
  }
  const accountTypeRaw = input.accountType?.trim() || "root";
  return {
    accountTypeRaw,
    accountTypeSegment: claimedMapSiteSegmentForAccountOrPlan(accountTypeRaw),
  };
}

async function reassignDemoBooksToClaimed(options: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  previousFastCode: string | null | undefined;
  previousMapsiteId: string;
  claimedMapsiteId: string;
  fastCode: string;
  propertyTitle: string;
  propertyAddress: string | null;
}): Promise<{ primaryBookSlug: string | null }> {
  const {
    supabase,
    previousFastCode,
    previousMapsiteId,
    claimedMapsiteId,
    fastCode,
    propertyTitle,
    propertyAddress,
  } = options;
  const code = fastCode.trim().toLowerCase();
  const prev = previousFastCode?.trim().toLowerCase() || "";
  const now = new Date().toISOString();

  // Move any books tied to the demonstration Mapsite™ / demo-* code onto the live code.
  if (prev && prev !== code) {
    await supabase
      .from("talisbooks_books")
      .update({
        fast_code: code,
        mapsite_id: claimedMapsiteId,
        updated_at: now,
      })
      .ilike("fast_code", prev);
  }

  await supabase
    .from("talisbooks_books")
    .update({
      fast_code: code,
      mapsite_id: claimedMapsiteId,
      updated_at: now,
    })
    .eq("mapsite_id", previousMapsiteId);

  // Rename leftover "Demo Mapsite™" titles so the FAST TEB™ shelf keeps them
  // (same inventory as self-serve after issue — not filtered as demonstration).
  const { data: claimedBooks } = await supabase
    .from("talisbooks_books")
    .select("id, slug, title, subtitle")
    .or(`mapsite_id.eq.${claimedMapsiteId},fast_code.ilike.${code}`)
    .order("updated_at", { ascending: false });

  let primaryBookSlug: string | null = null;
  for (const book of claimedBooks ?? []) {
    if (!primaryBookSlug && book.slug) {
      primaryBookSlug = book.slug;
    }
    const nextTitle = resolveClaimedBookTitle(
      book.title,
      propertyTitle,
      propertyAddress,
      fastCode,
    );
    if (nextTitle !== (book.title || "").trim()) {
      await supabase
        .from("talisbooks_books")
        .update({
          title: nextTitle,
          subtitle:
            book.subtitle?.trim() && !/demonstration/i.test(book.subtitle)
              ? book.subtitle
              : `${fastCode.trim().toUpperCase()} TEB™`,
          updated_at: now,
        })
        .eq("id", book.id);
    }
  }

  // Shared pinned-sample stays global — empty claimed shelves still pick up the
  // demo ebook via teb_url in getMapSiteEbookContext.
  return { primaryBookSlug };
}

export async function claimDemoMapSite(
  input: ClaimDemoMapSiteInput,
): Promise<ClaimDemoMapSiteResult> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Claim is unavailable until storage is configured.",
    };
  }

  const mapsiteId = input.mapsiteId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const middleName = input.middleName?.trim() || null;
  const email =
    input.email?.trim().toLowerCase() || "claim@talispros.com";

  if (!mapsiteId) {
    return { ok: false, error: "Missing Mapsite™ ID." };
  }
  if (!firstName || !lastName) {
    return { ok: false, error: "Enter your first and last name to claim." };
  }
  if (!input.audience?.trim() && !input.accountType?.trim()) {
    return {
      ok: false,
      error: "Choose who you are (same options as /start) before claiming.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error: loadError } = await supabase
    .from("mapsites")
    .select(MAPSITE_SELECT)
    .eq("id", mapsiteId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message };
  }
  if (!row) {
    return { ok: false, error: "Demo Mapsite™ not found." };
  }

  if (
    !isDemonstrationListing({
      isDemonstration: row.is_demonstration,
      fastCode: row.fast_code,
    })
  ) {
    return {
      ok: false,
      error: "That Mapsite™ is already claimed with a live FAST Code™.",
    };
  }

  let fastCode: string;
  try {
    fastCode = await generateFastCode({
      firstName,
      middleName,
      lastName,
    });
  } catch (error) {
    if (error instanceof FastCodeValidationError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not generate a FAST Code™ from that name.",
    };
  }

  const { accountTypeRaw, accountTypeSegment } = resolveClaimAccountType({
    ...input,
    accountType: input.accountType || row.account_type,
  });
  const agentName = `${firstName} ${lastName}`.trim();
  const now = new Date().toISOString();
  const propertyAddress = row.property_address?.trim() || null;
  const propertyTitle = isDemoPlaceholderTitle(row.property_title)
    ? propertyAddress || "Your Mapsite™"
    : row.property_title || propertyAddress || "Your Mapsite™";
  const propertyDescription = resolveClaimedDescription(
    row.property_description,
    propertyAddress,
  );
  // Preserve the demo-selected pin exactly — never geolocation / local default.
  const latitude = row.latitude;
  const longitude = row.longitude;
  const mapZoom = row.map_zoom;
  let tebUrl = row.teb_url?.trim() || DEMO_PINNED_EBOOK_HREF;
  // Stand-in for SamCart payment URL: register path → FAST Code™ gate → Mapsite™.
  const registerPath = mapsiteUrlGatePath(fastCode);

  const { error: fastInsertError } = await supabase.from("fast_codes").upsert(
    {
      code: fastCode,
      type: "mapsite",
      account_type: accountTypeRaw,
      mapsite_id: mapsiteId,
    },
    { onConflict: "code" },
  );

  if (fastInsertError) {
    return {
      ok: false,
      error: `FAST Code™ could not be saved: ${fastInsertError.message}`,
    };
  }

  const protectSeed =
    isProtectedPlatformDemoMapSite(row.id) ||
    row.fast_code?.trim().toUpperCase() === DEMO_MAPSITE_FAST_CODE;

  let claimedMapsiteId = row.id;
  const previousFastCode = row.fast_code;

  if (protectSeed) {
    // Keep the platform DEMO seed; copy pin/listing into a new claimed row.
    const insert: Database["public"]["Tables"]["mapsites"]["Insert"] = {
      fast_code: fastCode,
      slug: fastCode,
      account_type: accountTypeRaw,
      owner_first_name: firstName,
      owner_last_name: lastName,
      agent_name: agentName,
      email,
      phone: row.phone || "",
      status: "active",
      property_title: propertyTitle,
      property_address: propertyAddress,
      property_description: propertyDescription,
      latitude,
      longitude,
      map_zoom: mapZoom,
      cover_image: row.cover_image,
      header_image_url: row.header_image_url,
      logo_url: row.logo_url,
      profile_image_url: row.profile_image_url,
      gallery_images: row.gallery_images || [],
      mls_url: row.mls_url,
      broker_url: registerPath,
      website: registerPath,
      teb_url: tebUrl,
      ttv_url: row.ttv_url,
      is_demonstration: false,
      interest_form_enabled: true,
      offered_subscription_tier: "root",
      updated_at: now,
    };

    const { data: created, error: createError } = await supabase
      .from("mapsites")
      .insert(insert)
      .select("id")
      .single();

    if (createError || !created) {
      return {
        ok: false,
        error:
          createError?.message ||
          "Could not create the claimed Mapsite™ from the demonstration.",
      };
    }
    claimedMapsiteId = created.id;

    await supabase
      .from("fast_codes")
      .update({ mapsite_id: claimedMapsiteId })
      .ilike("code", fastCode);
  } else {
    const { error: updateError } = await supabase
      .from("mapsites")
      .update({
        fast_code: fastCode,
        slug: fastCode,
        account_type: accountTypeRaw,
        owner_first_name: firstName,
        owner_last_name: lastName,
        agent_name: agentName,
        email,
        status: "active",
        property_title: propertyTitle,
        property_address: propertyAddress,
        property_description: propertyDescription,
        // Keep the demo pin placement — do not overwrite with geolocation/default.
        latitude,
        longitude,
        map_zoom: mapZoom,
        broker_url: registerPath,
        website: registerPath,
        teb_url: tebUrl,
        is_demonstration: false,
        interest_form_enabled: true,
        updated_at: now,
      })
      .eq("id", row.id);

    if (updateError) {
      return {
        ok: false,
        error: `Could not convert the demo Mapsite™: ${updateError.message}`,
      };
    }

    await supabase
      .from("fast_codes")
      .update({ mapsite_id: claimedMapsiteId })
      .ilike("code", fastCode);
  }

  try {
    const { primaryBookSlug } = await reassignDemoBooksToClaimed({
      supabase,
      previousFastCode,
      previousMapsiteId: row.id,
      claimedMapsiteId,
      fastCode,
      propertyTitle,
      propertyAddress,
    });
    // Prefer the claimed ebook viewer (self-serve style) over the global pinned sample.
    if (primaryBookSlug) {
      tebUrl = `${ROUTES.TALISBOOKS}/viewer/${encodeURIComponent(primaryBookSlug)}`;
      await supabase
        .from("mapsites")
        .update({ teb_url: tebUrl, updated_at: now })
        .eq("id", claimedMapsiteId);
    }
  } catch (error) {
    console.warn("[claimDemoMapSite] Could not reassign demo ebook shelf:", error);
  }

  const href = buildClaimedMapSitePath({
    fastCode,
    accountType: accountTypeSegment,
  });
  const tebHref = `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(
    fastCode.trim().toLowerCase(),
  )}`;

  return {
    ok: true,
    mapsiteId: claimedMapsiteId,
    fastCode,
    href,
    accountTypeSegment,
    tebHref,
  };
}
