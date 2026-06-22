import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
        : `MapSite with code "${code}" not found`,
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
