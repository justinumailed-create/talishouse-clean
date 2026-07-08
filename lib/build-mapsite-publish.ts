import type { Database } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import { generateMapSiteSlug } from "@/lib/slug-generator";

export interface PublishBuildMapSiteInput {
  fastCode: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  streetAddress: string;
  latitude: number | null;
  longitude: number | null;
  pinWriteup: string;
  futurePinLabel: string;
  profileImageUrl: string | null;
  logoImageUrl: string | null;
  headerImageUrl: string | null;
  galleryImageUrls: string[];
  sponsorFastCode?: string | null;
}

export interface PublishBuildMapSiteResult {
  mapsiteId: string;
  fastCode: string;
}

export function offeredTierFromBuildAccountType(
  accountType: string
): OfferedSubscriptionTier {
  if (accountType === "derivative") return "derivative";
  if (accountType.startsWith("adpro")) return "adpro";
  return "root";
}

export function accountTypeLabelFromBuildAccountType(accountType: string): string {
  if (accountType === "root") return "Root Account™";
  if (accountType === "derivative") return "Derivative Account™";
  if (accountType.startsWith("adpro")) return "Adpro PIN";
  return accountType;
}

export async function publishBuildMapSite(
  input: PublishBuildMapSiteInput
): Promise<PublishBuildMapSiteResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const fastCode = input.fastCode.trim().toLowerCase();
  const ownerFirstName = input.firstName.trim();
  const ownerLastName = input.lastName.trim();
  const agentName = `${ownerFirstName} ${ownerLastName}`.trim();
  const offeredTier = offeredTierFromBuildAccountType(input.accountType);

  const { data: existingSlugs, error: slugError } = await supabaseAdmin
    .from("mapsites")
    .select("slug");

  if (slugError) {
    throw new Error(`Failed to fetch existing MapSite slugs: ${slugError.message}`);
  }

  const slug = await generateMapSiteSlug(
    (existingSlugs || []).map((row) => row.slug)
  );

  const mapsiteRecord: Database["public"]["Tables"]["mapsites"]["Insert"] = {
    fast_code: fastCode,
    slug,
    account_type: accountTypeLabelFromBuildAccountType(input.accountType),
    owner_first_name: ownerFirstName,
    owner_last_name: ownerLastName,
    agent_name: agentName,
    email: input.email.trim().toLowerCase(),
    phone: "",
    status: "active",
    property_title: agentName ? `${agentName} MapSite™` : "MapSite™",
    property_address: input.streetAddress.trim() || null,
    property_description: input.pinWriteup.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    profile_image_url: input.profileImageUrl,
    logo_url: input.logoImageUrl,
    header_image_url: input.headerImageUrl,
    gallery_images:
      input.galleryImageUrls.length > 0 ? input.galleryImageUrls : undefined,
    map_zoom: 14,
    offered_subscription_tier: offeredTier,
    interest_form_enabled: true,
  };

  const { data: mapsite, error: mapsiteError } = await supabaseAdmin
    .from("mapsites")
    .insert(mapsiteRecord)
    .select("id, fast_code")
    .single();

  if (mapsiteError || !mapsite) {
    throw new Error(
      `Failed to create MapSite: ${mapsiteError?.message || "Unknown error"}`
    );
  }

  if (
    input.latitude !== null &&
    input.longitude !== null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    const pinName =
      input.futurePinLabel.trim() ||
      input.streetAddress.trim() ||
      "Home PIN";

    const pinRecord: Database["public"]["Tables"]["pins"]["Insert"] = {
      mapsite_id: mapsite.id,
      name: pinName,
      description: input.pinWriteup.trim() || "",
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.streetAddress.trim() || "",
      featured: true,
      sort_order: 0,
    };

    const { error: pinError } = await supabaseAdmin
      .from("pins")
      .insert(pinRecord);

    if (pinError) {
      console.error("[build-mapsite] Pin insert error:", pinError);
    }
  }

  return {
    mapsiteId: mapsite.id,
    fastCode: mapsite.fast_code,
  };
}
