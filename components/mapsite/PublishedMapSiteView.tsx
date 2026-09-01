import MapSiteLayout from "@/components/mapsite/MapSiteLayout";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { getMapSiteByFastCode, type MapSiteView } from "@/lib/mapsite-service";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
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
    profileImageUrl: record.cover_image,
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

export async function loadPublishedMapSiteView(fastCode: string) {
  try {
    const existing = await getMapSiteByFastCode(fastCode);
    if (existing) return existing;
  } catch {
    // Platform mapsites may not satisfy the account-backed Mapsite™ view.
  }

  const platform = await getMapSitePlatformByFastCode(fastCode);
  if (!platform) return null;
  return mapSiteViewFromPlatform(platform);
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
