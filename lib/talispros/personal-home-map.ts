import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { tryGetSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";
import { ROUTES } from "@/lib/routes";
import { withEbookListingMedia } from "@/lib/talispros/mapsite-listing-media";
import {
  DEMO_MAPSITE_COORDINATES,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";
import { DEMO_MAPSITE_ID, toPlatformStatus } from "@/lib/talispros/mapsite-state";
import type { MapsiteFlagIdentity } from "@/lib/talispros/flag-identity";
import { parseMapsiteFlagIdentity } from "@/lib/talispros/flag-identity";

export type PersonalHomeMapModel = {
  mapsite: MapSitePlatformRecord;
  flagIdentity: MapsiteFlagIdentity | null;
  flagName: string | null;
  hasTalisBook: boolean;
};

type MapSiteRow = {
  id: string;
  fast_code: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  map_zoom: number | null;
  property_title: string | null;
  property_address: string | null;
  property_description: string | null;
  cover_image: string | null;
  header_image_url: string | null;
  logo_url: string | null;
  profile_image_url: string | null;
  agent_name: string | null;
  gallery_images: string[] | null;
  mls_url: string | null;
  broker_url: string | null;
  teb_url: string | null;
  ttv_url: string | null;
  is_demonstration: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function client(): SupabaseClient {
  return (tryGetSupabaseAdmin() ?? supabase) as unknown as SupabaseClient;
}

function isPlatformDemoPin(id: string, latitude: number, longitude: number): boolean {
  if (id === DEMO_MAPSITE_ID) return true;
  return (
    Math.abs(latitude - DEMO_MAPSITE_COORDINATES.lat) < 0.0008 &&
    Math.abs(longitude - DEMO_MAPSITE_COORDINATES.lng) < 0.0008
  );
}

function recordFromRow(row: MapSiteRow): MapSitePlatformRecord | null {
  if (row.latitude == null || row.longitude == null) return null;
  if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) return null;
  if (isPlatformDemoPin(row.id, row.latitude, row.longitude)) return null;
  const gallery = Array.isArray(row.gallery_images) ? row.gallery_images.filter(Boolean) : [];
  return {
    id: row.id,
    fast_code: row.fast_code,
    status: toPlatformStatus(row.status),
    lat: row.latitude,
    lng: row.longitude,
    map_zoom: row.map_zoom ?? 10,
    property_title: row.property_title?.trim() || row.fast_code || "Mapsite",
    property_address: row.property_address,
    property_description: row.property_description,
    cover_image: row.cover_image || row.header_image_url,
    logo_url: row.logo_url,
    agency_name: row.property_title,
    profile_image_url: row.profile_image_url,
    agent_name: row.agent_name,
    gallery_images: gallery,
    mls_url: row.mls_url,
    broker_url: row.broker_url,
    teb_url: row.teb_url,
    ttv_url: row.ttv_url,
    assigned_marketing_manager: null,
    is_demonstration: Boolean(row.is_demonstration),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * This FAST Code's own Mapsite for the personal-home left column.
 * Reads the Mapsite row directly. Never substitutes the platform demonstration pin.
 */
export async function loadPersonalHomeMap(
  rawCode: string,
): Promise<PersonalHomeMapModel | null> {
  const code = rawCode.trim().toLowerCase();
  if (!code) return null;
  const db = client();
  const [{ data: row, error }, { data: books }] = await Promise.all([
    db
      .from("mapsites")
      .select(
        "id, fast_code, status, latitude, longitude, map_zoom, property_title, property_address, property_description, cover_image, header_image_url, logo_url, profile_image_url, agent_name, gallery_images, mls_url, broker_url, teb_url, ttv_url, is_demonstration, created_at, updated_at",
      )
      .ilike("fast_code", code)
      .limit(1)
      .maybeSingle(),
    db
      .from("talisbooks_books")
      .select("slug, metadata")
      .ilike("fast_code", code)
      .eq("publish_status", "published")
      .limit(2),
  ]);
  if (error || !row) return null;
  const mapsite = recordFromRow(row as MapSiteRow);
  if (!mapsite) return null;

  const published = (books ?? []) as { slug?: string | null; metadata?: Record<string, unknown> | null }[];
  const only = published.length === 1 ? published[0] : null;
  const slug = only?.slug?.trim() || "";
  const tebOwnBookHref = slug
    ? `${ROUTES.TALISBOOKS_VIEWER}/${encodeURIComponent(slug)}`
    : null;
  const metadata = only?.metadata ?? {};
  const galleryUrls = Array.isArray(metadata.galleryImageUrls)
    ? metadata.galleryImageUrls.filter((value): value is string => typeof value === "string")
    : [];
  const cover =
    typeof metadata.coverImageUrl === "string" ? metadata.coverImageUrl.trim() : "";
  const listingImageUrls = galleryUrls.length > 0 ? galleryUrls : cover ? [cover] : [];
  const enriched = withEbookListingMedia(
    {
      ...mapsite,
      fast_code: mapsite.fast_code || code.toUpperCase(),
      teb_own_book_href: tebOwnBookHref,
      url1_opens_broker_url: true,
    },
    listingImageUrls,
  );
  const flagName =
    typeof metadata.flagName === "string" && metadata.flagName.trim()
      ? metadata.flagName.trim()
      : null;

  return {
    mapsite: enriched,
    flagIdentity: metadata.flagIdentity ? parseMapsiteFlagIdentity(String(metadata.flagIdentity)) : null,
    flagName,
    hasTalisBook: Boolean(tebOwnBookHref || enriched.teb_url || published.length > 0),
  };
}
