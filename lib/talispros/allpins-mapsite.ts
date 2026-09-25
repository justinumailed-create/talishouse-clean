/**
 * ALLPINS — aggregate Mapsite™ that shows every existing Mapsite™ pin
 * (exact lat/lng from the mapsites table) with showcase cards for books
 * and the source Mapsite™ demos. Linked to the catalogue isolated shelf.
 *
 * Single-pin Mapsites™ (rm22, lg01, …) are unchanged — this path only
 * activates when the FAST Code is ALLPINS.
 */

import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import {
  ALLPINS_FAST_CODE,
  isAllPinsFastCode,
} from "@/lib/talispros/allpins-mapsite-constants";
import {
  buildClaimedMapSitePath,
  publishedMapSitePath,
} from "@/lib/talispros/mapsite-state";

export { ALLPINS_FAST_CODE, isAllPinsFastCode };

export type AllPinsShowcasePin = {
  id: string;
  sourceMapsiteId: string;
  fastCode: string;
  label: string;
  address: string | null;
  latitude: number;
  longitude: number;
  coverImageUrl: string | null;
  mapsiteHref: string;
  publishedHref: string;
  bookHref: string | null;
  bookTitle: string | null;
  bookSlug: string | null;
};

export type AllPinsAggregation = {
  mapsiteId: string;
  fastCode: typeof ALLPINS_FAST_CODE;
  pins: AllPinsShowcasePin[];
  isolatedBooks: Array<{
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    viewerHref: string;
  }>;
  center: { latitude: number; longitude: number };
  zoom: number;
};

function accountTypeSegment(accountType: string | null | undefined): string {
  const raw = (accountType || "").toLowerCase();
  if (raw.includes("fsbo")) return "fsbos";
  if (raw.includes("adpro")) return "adpro";
  if (raw.includes("root") || raw.includes("broker")) return "brokers";
  return "listings";
}

/**
 * Every Mapsite™ with real coordinates (excluding ALLPINS itself),
 * plus the newest book for that FAST Code / mapsite when present.
 */
export async function listAllPinsAggregatedPins(): Promise<
  AllPinsShowcasePin[]
> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getSupabaseAdmin();

  const { data: mapsites, error } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, property_title, property_address, latitude, longitude, cover_image, header_image_url, gallery_images, teb_url, account_type, status, is_demonstration, created_at",
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !mapsites) {
    console.error("[allpins] list mapsites:", error?.message);
    return [];
  }

  const sources = mapsites.filter((row) => {
    const code = (row.fast_code || "").trim().toLowerCase();
    if (!code || code === ALLPINS_FAST_CODE) return false;
    if (row.latitude == null || row.longitude == null) return false;
    if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) {
      return false;
    }
    return true;
  });

  const byCode = new Map<string, (typeof sources)[number]>();
  for (const row of sources) {
    const code = row.fast_code!.trim().toLowerCase();
    if (!byCode.has(code)) byCode.set(code, row);
  }
  const unique = [...byCode.values()];
  const codes = unique.map((row) => row.fast_code!.trim().toLowerCase());
  const mapsiteIds = unique.map((row) => row.id);

  type BookRow = {
    id: string;
    title: string;
    slug: string;
    fast_code: string | null;
    mapsite_id: string | null;
    is_public: boolean | null;
    metadata: Record<string, unknown> | null;
  };

  let books: BookRow[] = [];
  if (mapsiteIds.length > 0 || codes.length > 0) {
    const filters: string[] = [];
    if (mapsiteIds.length) {
      filters.push(`mapsite_id.in.(${mapsiteIds.join(",")})`);
    }
    if (codes.length) {
      filters.push(
        `fast_code.in.(${codes.map((c) => JSON.stringify(c)).join(",")})`,
      );
    }
    const { data } = await supabase
      .from("talisbooks_books")
      .select(
        "id, title, slug, fast_code, mapsite_id, is_public, metadata, updated_at",
      )
      .or(filters.join(","))
      .order("updated_at", { ascending: false })
      .limit(400);
    books = (data || []) as BookRow[];
  }

  const bookByMapsiteId = new Map<string, BookRow>();
  const bookByFastCode = new Map<string, BookRow>();
  for (const raw of books) {
    if (raw.mapsite_id && !bookByMapsiteId.has(raw.mapsite_id)) {
      bookByMapsiteId.set(raw.mapsite_id, raw);
    }
    const code = raw.fast_code?.trim().toLowerCase();
    if (code && !bookByFastCode.has(code)) {
      bookByFastCode.set(code, raw);
    }
  }

  return unique.map((row) => {
    const code = row.fast_code!.trim().toLowerCase();
    const book =
      bookByMapsiteId.get(row.id) || bookByFastCode.get(code) || null;
    const coverFromGallery = Array.isArray(row.gallery_images)
      ? row.gallery_images.find(
          (url): url is string =>
            typeof url === "string" && url.trim().length > 0,
        )
      : null;
    const coverImageUrl =
      row.cover_image?.trim() ||
      row.header_image_url?.trim() ||
      coverFromGallery ||
      (typeof book?.metadata?.coverImageUrl === "string"
        ? book.metadata.coverImageUrl
        : null) ||
      null;
    const tebFromMapsite = row.teb_url?.trim() || null;
    const bookHref = book
      ? `${ROUTES.TALISBOOKS_VIEWER}/${book.slug}`
      : tebFromMapsite;
    const segment = accountTypeSegment(row.account_type);
    return {
      id: row.id,
      sourceMapsiteId: row.id,
      fastCode: code,
      label:
        row.property_title?.trim() ||
        row.property_address?.trim() ||
        code.toUpperCase(),
      address: row.property_address?.trim() || null,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      coverImageUrl,
      mapsiteHref: buildClaimedMapSitePath({
        fastCode: code,
        accountType: segment,
      }),
      publishedHref: publishedMapSitePath(code),
      bookHref,
      bookTitle: book?.title?.trim() || null,
      bookSlug: book?.slug || null,
    } satisfies AllPinsShowcasePin;
  });
}

function computeViewport(pins: AllPinsShowcasePin[]): {
  center: { latitude: number; longitude: number };
  zoom: number;
} {
  if (pins.length === 0) {
    return { center: { latitude: 45.0, longitude: -63.0 }, zoom: 4 };
  }
  if (pins.length === 1) {
    return {
      center: { latitude: pins[0]!.latitude, longitude: pins[0]!.longitude },
      zoom: 12,
    };
  }
  let minLat = pins[0]!.latitude;
  let maxLat = pins[0]!.latitude;
  let minLng = pins[0]!.longitude;
  let maxLng = pins[0]!.longitude;
  for (const pin of pins) {
    minLat = Math.min(minLat, pin.latitude);
    maxLat = Math.max(maxLat, pin.latitude);
    minLng = Math.min(minLng, pin.longitude);
    maxLng = Math.max(maxLng, pin.longitude);
  }
  const center = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };
  const latSpan = Math.max(0.01, maxLat - minLat);
  const lngSpan = Math.max(0.01, maxLng - minLng);
  const span = Math.max(latSpan, lngSpan);
  let zoom = 3;
  if (span < 0.5) zoom = 10;
  else if (span < 2) zoom = 8;
  else if (span < 10) zoom = 6;
  else if (span < 40) zoom = 4;
  else zoom = 3;
  return { center, zoom };
}

/**
 * Ensure the ALLPINS Mapsite™ + fast_codes row exist, sync `pins` from
 * live Mapsite™ coordinates, and return the aggregation for the UI.
 */
export async function ensureAllPinsMapSite(): Promise<AllPinsAggregation | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const pins = await listAllPinsAggregatedPins();
  const viewport = computeViewport(pins);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("mapsites")
    .select("id, fast_code")
    .ilike("fast_code", ALLPINS_FAST_CODE)
    .maybeSingle();

  let mapsiteId = existing?.id as string | undefined;

  if (!mapsiteId) {
    const insert = {
      fast_code: ALLPINS_FAST_CODE,
      slug: ALLPINS_FAST_CODE,
      account_type: "Root Account™",
      owner_first_name: "Talispros",
      owner_last_name: "ALLPINS",
      agent_name: "ALLPINS Showcase",
      email: "allpins@talispros.com",
      phone: "",
      status: "active",
      property_title: "ALLPINS — Every Mapsite™",
      property_address: "Aggregated live Mapsite™ pins",
      property_description:
        "Showcase map of every Mapsite™ pin. Open a pin for the book and Mapsite™ demo.",
      latitude: viewport.center.latitude,
      longitude: viewport.center.longitude,
      map_zoom: viewport.zoom,
      cover_image: pins.find((p) => p.coverImageUrl)?.coverImageUrl || null,
      header_image_url:
        pins.find((p) => p.coverImageUrl)?.coverImageUrl || null,
      gallery_images: pins
        .map((p) => p.coverImageUrl)
        .filter((url): url is string => Boolean(url))
        .slice(0, 12),
      is_demonstration: false,
      interest_form_enabled: false,
      offered_subscription_tier: "root",
      updated_at: now,
    };

    const { data: created, error } = await supabase
      .from("mapsites")
      .insert(insert)
      .select("id")
      .single();

    if (error || !created) {
      console.error("[allpins] create mapsite:", error?.message);
      return null;
    }
    mapsiteId = created.id;
  } else {
    await supabase
      .from("mapsites")
      .update({
        status: "active",
        property_title: "ALLPINS — Every Mapsite™",
        property_address: "Aggregated live Mapsite™ pins",
        property_description:
          "Showcase map of every Mapsite™ pin. Open a pin for the book and Mapsite™ demo.",
        latitude: viewport.center.latitude,
        longitude: viewport.center.longitude,
        map_zoom: viewport.zoom,
        updated_at: now,
      })
      .eq("id", mapsiteId);
  }

  const { data: fastRow } = await supabase
    .from("fast_codes")
    .select("id, mapsite_id")
    .ilike("code", ALLPINS_FAST_CODE)
    .maybeSingle();

  if (!fastRow) {
    await supabase.from("fast_codes").insert({
      code: ALLPINS_FAST_CODE,
      type: "root",
      account_type: "root",
      mapsite_id: mapsiteId,
    });
  } else if (fastRow.mapsite_id !== mapsiteId) {
    await supabase
      .from("fast_codes")
      .update({ mapsite_id: mapsiteId })
      .eq("id", fastRow.id);
  }

  await supabase.from("pins").delete().eq("mapsite_id", mapsiteId);
  if (pins.length > 0) {
    const pinRows = pins.map((pin, index) => ({
      mapsite_id: mapsiteId!,
      name: `${pin.fastCode.toUpperCase()} — ${pin.label}`.slice(0, 120),
      description: [
        pin.address || "",
        pin.bookHref ? `Book: ${pin.bookHref}` : "",
        `Mapsite: ${pin.mapsiteHref}`,
      ]
        .filter(Boolean)
        .join("\n"),
      latitude: pin.latitude,
      longitude: pin.longitude,
      address: pin.address || "",
      website: pin.mapsiteHref,
      featured: index < 3,
      sort_order: index,
    }));
    const { error: pinError } = await supabase.from("pins").insert(pinRows);
    if (pinError) {
      console.error("[allpins] sync pins:", pinError.message);
    }
  }

  const { data: isolatedRows } = await supabase
    .from("talisbooks_books")
    .select("id, title, slug, metadata, updated_at")
    .contains("metadata", { isolatedBookshelf: true })
    .order("updated_at", { ascending: false })
    .limit(50);

  const isolatedBooks = (isolatedRows || []).map((row) => {
    const metadata = (row.metadata as Record<string, unknown>) || {};
    const cover =
      typeof metadata.coverImageUrl === "string"
        ? metadata.coverImageUrl
        : null;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      coverImageUrl: cover,
      viewerHref: `${ROUTES.TALISBOOKS_VIEWER}/${row.slug}`,
    };
  });

  return {
    mapsiteId,
    fastCode: ALLPINS_FAST_CODE,
    pins,
    isolatedBooks,
    center: viewport.center,
    zoom: viewport.zoom,
  };
}

export function allPinsClaimedHref(): string {
  return buildClaimedMapSitePath({
    fastCode: ALLPINS_FAST_CODE,
    accountType: "brokers",
  });
}

export function allPinsPublishedHref(): string {
  return publishedMapSitePath(ALLPINS_FAST_CODE);
}
