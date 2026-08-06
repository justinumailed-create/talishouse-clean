import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateMapSiteSlug } from "@/lib/slug-generator";
import { getDefaultSections } from "@/lib/mapsite-template";
import type { Database } from "@/lib/database.types";

export interface MapSiteRecord {
  fastCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  description: string;
  mediaType: string;
  status: string;
  profileImageUrl: string | null;
  logoImageUrl: string | null;
  pinImageUrl: string | null;
  monologuePdfUrl: string | null;
  ebookPdfUrl: string | null;
  createdAt: string;
}

export interface MapSiteError {
  notFound: true;
  message: string;
}

export interface MapSiteCreateInput {
  fastCode: string;
  accountType: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone?: string;
  city?: string;
  province?: string;
}

export interface MapSiteCreateResult {
  id: string;
  fastCode: string;
  slug: string;
  url: string;
}

export async function getMapSiteByFastCode(
  fastCode: string
): Promise<MapSiteRecord | MapSiteError> {
  const code = fastCode.trim().toUpperCase();
  if (!code) {
    return { notFound: true, message: "FAST code is required" };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: fcData, error: fcError } = await supabaseAdmin
    .from("fast_codes")
    .select("id, code, request_id")
    .eq("code", code)
    .eq("type", "mapsite")
    .maybeSingle();

  if (fcError || !fcData) {
    return {
      notFound: true,
      message: fcError
        ? `Database error: ${fcError.message}`
        : `Mapsite™ with code "${code}" not found`,
    };
  }

  const requestId = fcData.request_id;
  if (!requestId) {
    return {
      notFound: true,
      message: `FAST code "${code}" has no associated build request`,
    };
  }

  const [{ data: brData }, { data: msData }, { data: assetData }] =
    await Promise.all([
      supabaseAdmin
        .from("build_requests")
        .select("first_name, last_name, email, phone, media_focus, created_at")
        .eq("id", requestId)
        .maybeSingle(),
      supabaseAdmin
        .from("mapsite_requests")
        .select("type, status")
        .eq("request_id", requestId)
        .maybeSingle(),
      supabaseAdmin
        .from("mapsite_assets")
        .select("profile_image, logo_image, pin_image, monologue_pdf, ebook_pdf")
        .eq("request_id", requestId)
        .maybeSingle(),
    ]);

  return {
    fastCode: fcData.code,
    firstName: brData?.first_name || "",
    lastName: brData?.last_name || "",
    email: brData?.email || "",
    phone: brData?.phone || "",
    description: brData?.media_focus || "",
    mediaType: msData?.type || "standard",
    status: msData?.status || "unknown",
    profileImageUrl: assetData?.profile_image || null,
    logoImageUrl: assetData?.logo_image || null,
    pinImageUrl: assetData?.pin_image || null,
    monologuePdfUrl: assetData?.monologue_pdf || null,
    ebookPdfUrl: assetData?.ebook_pdf || null,
    createdAt: brData?.created_at || "",
  };
}

export async function getMapSiteBySlug(
  slug: string
): Promise<MapSiteRecord | MapSiteError> {
  const cleanSlug = slug.trim().toUpperCase();
  if (!cleanSlug) {
    return { notFound: true, message: "Slug is required" };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: mapsite, error: msError } = await supabaseAdmin
    .from("mapsites")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (msError || !mapsite) {
    return {
      notFound: true,
      message: msError
        ? `Database error: ${msError.message}`
        : `Mapsite™ with slug "${cleanSlug}" not found`,
    };
  }

  const sections = getDefaultSections({
    firstName: mapsite.owner_first_name,
    lastName: mapsite.owner_last_name,
    email: mapsite.email,
    phone: mapsite.phone || "",
    fastCode: mapsite.fast_code,
  });

  const heroSection = sections.find((s) => s.type === "hero");

  return {
    fastCode: mapsite.fast_code,
    firstName: mapsite.owner_first_name,
    lastName: mapsite.owner_last_name,
    email: mapsite.email,
    phone: mapsite.phone || "",
    description: heroSection?.content?.subtext || "",
    mediaType: "mapsite",
    status: mapsite.status,
    profileImageUrl: null,
    logoImageUrl: null,
    pinImageUrl: null,
    monologuePdfUrl: null,
    ebookPdfUrl: null,
    createdAt: mapsite.created_at,
  };
}

export async function createMapSite(
  input: MapSiteCreateInput
): Promise<MapSiteCreateResult> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingSlugs, error: slugError } = await supabaseAdmin
    .from("mapsites")
    .select("slug");

  if (slugError) {
    throw new Error(`Failed to fetch existing slugs: ${slugError.message}`);
  }

  const slug = await generateMapSiteSlug(
    (existingSlugs || []).map((r) => r.slug)
  );

  const record: Database["public"]["Tables"]["mapsites"]["Insert"] = {
    fast_code: input.fastCode.trim().toUpperCase(),
    slug,
    account_type: input.accountType,
    owner_first_name: input.ownerFirstName.trim(),
    owner_last_name: input.ownerLastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || "",
    status: "active",
  };

  const { data: created, error: insertError } = await supabaseAdmin
    .from("mapsites")
    .insert(record)
    .select()
    .single();

  if (insertError || !created) {
    throw new Error(`Failed to create Mapsite™: ${insertError?.message || "Unknown error"}`);
  }

  return {
    id: created.id,
    fastCode: created.fast_code,
    slug: created.slug,
    url: `/ma/${created.slug}`,
  };
}
