import MapSiteLayout from "@/components/mapsite/MapSiteLayout";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { getMapSiteByFastCode, type MapSiteView } from "@/lib/mapsite-service";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { getMapSitePlatformByFastCode, type MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";

function mapSiteViewFromPlatform(record: MapSitePlatformRecord): MapSiteView {
  const code = (record.fast_code || "").trim();
  const createdAt = record.created_at || new Date().toISOString();
  const galleryImages = record.gallery_images.filter(Boolean);

  return {
    id: record.id,
    fastCode: code,
    accountId: null,
    slug: code.toLowerCase(),
    accountType: "root",
    ownerFirstName: "",
    ownerLastName: "",
    agentName: record.assigned_marketing_manager,
    email: "",
    phone: "",
    website: record.broker_url,
    status: record.status.toLowerCase(),
    propertyTitle: record.property_title,
    propertyAddress: record.property_address,
    propertyDescription: record.property_description,
    latitude: record.lat,
    longitude: record.lng,
    price: null,
    profileImageUrl: null,
    logoUrl: null,
    headerImageUrl: record.cover_image,
    videoUrl: record.ttv_url,
    galleryImages,
    galleryItems: galleryImages.map((url, index) => ({
      url,
      description: "",
      sortOrder: index,
      visible: true,
    })),
    mapZoom: record.map_zoom,
    metaTitle: record.property_title,
    metaDescription: record.property_description,
    ogImageUrl: record.cover_image,
    atlistMapUrl: null,
    offeredSubscriptionTier: "root",
    interestFormEnabled: true,
    createdAt,
    updatedAt: record.updated_at || createdAt,
    pins: [
      {
        id: record.id,
        name: record.property_title || code,
        description: record.property_description || "",
        latitude: record.lat,
        longitude: record.lng,
        address: record.property_address || "",
        city: "",
        province: "",
        postalCode: "",
        country: "",
        website: record.broker_url || "",
        phone: "",
        email: "",
        featured: true,
        sortOrder: 0,
      },
    ],
    mlsUrl: record.mls_url,
    brokerUrl: record.broker_url,
    tebUrl: record.teb_url,
    ttvUrl: record.ttv_url,
  };
}

async function enrichPublishedBranding(
  fastCode: string,
  view: MapSiteView,
): Promise<MapSiteView> {
  if (!isSupabaseAdminConfigured()) return view;

  const supabase = getSupabaseAdmin();
  const [{ data: row }, { data: fastCodeRow }] = await Promise.all([
    supabase
      .from("mapsites")
      .select(
        "logo_url, profile_image_url, agent_name, email, phone, owner_first_name, owner_last_name",
      )
      .ilike("fast_code", fastCode)
      .maybeSingle(),
    supabase
      .from("fast_codes")
      .select("request_id")
      .ilike("code", fastCode)
      .maybeSingle(),
  ]);

  let assets: { profile_image: string | null; logo_image: string | null } | null =
    null;
  const requestId = fastCodeRow?.request_id || view.requestId;
  if (requestId) {
    const { data } = await supabase
      .from("mapsite_assets")
      .select("profile_image, logo_image")
      .eq("request_id", requestId)
      .maybeSingle();
    assets = data;
  }

  const logoUrl = row?.logo_url || assets?.logo_image || view.logoUrl;
  const profileImageUrl =
    row?.profile_image_url || assets?.profile_image || view.profileImageUrl;
  const agentName = row?.agent_name?.trim() || view.agentName;
  const email = row?.email?.trim() || view.email;
  const phone = row?.phone?.trim() || view.phone;

  return {
    ...view,
    logoUrl,
    profileImageUrl,
    agentName,
    email,
    phone,
    ownerFirstName: row?.owner_first_name || view.ownerFirstName,
    ownerLastName: row?.owner_last_name || view.ownerLastName,
  };
}

export async function loadPublishedMapSiteView(fastCode: string) {
  let view: MapSiteView | null = null;
  try {
    view = await getMapSiteByFastCode(fastCode);
  } catch {
    view = null;
  }

  if (!view) {
    const platform = await getMapSitePlatformByFastCode(fastCode);
    if (!platform) return null;
    view = mapSiteViewFromPlatform(platform);
  }

  try {
    return await enrichPublishedBranding(fastCode, view);
  } catch (error) {
    console.warn(
      "[published-mapsite] Could not load logo/photo branding:",
      error instanceof Error ? error.message : error,
    );
    return view;
  }
}

export function publishedMapSiteMetadata(mapsite: MapSiteView) {
  const layoutData = buildMapSiteLayoutData(mapsite);
  return {
    title: layoutData.metaTitle || `${layoutData.propertyTitle} | Mapsite™`,
    description:
      layoutData.metaDescription ||
      layoutData.summary.description ||
      `Mapsite™ ${layoutData.fastCode}`,
    openGraph: layoutData.ogImageUrl
      ? {
          images: [{ url: layoutData.ogImageUrl }],
        }
      : undefined,
  };
}

export default async function PublishedMapSiteView({
  mapsite,
}: {
  mapsite: MapSiteView;
}) {
  const layoutData = buildMapSiteLayoutData(mapsite);
  const [visitorStatus, editAccess, buildRequestLink] = await Promise.all([
    getMapSiteVisitorAccountStatus(),
    getMapSiteEditToolbarState(mapsite.fastCode),
    getSupabaseAdmin()
      .from("build_requests")
      .select("id")
      .or(
        `linked_mapsite_id.eq.${mapsite.id},requested_fast_code.eq.${mapsite.fastCode}`
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <MapSiteLayout
      data={layoutData}
      visitorHasSubscribed={visitorStatus.hasSubscribed}
      visitorFastCode={visitorStatus.fastCode}
      editAccess={editAccess}
      buildRequestId={buildRequestLink.data?.id}
    />
  );
}
