import type { MapSitePinView, MapSiteView } from "./mapsite-service";
import type { TalisMapsPin } from "./talismaps";

export const MAPSITE_HEADER_FALLBACK_LOGO =
  "/images/mapsites/header-fallback-logo.jpeg";

export interface MapSiteAgentData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
}

export interface MapSiteSummaryData {
  description: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  price: string | null;
}

export interface MapSiteLayoutData {
  id: string;
  fastCode: string;
  accountType: string;
  status: string;
  slug: string;
  propertyTitle: string;
  logoUrl: string | null;
  headerImageUrl: string | null;
  agent: MapSiteAgentData;
  summary: MapSiteSummaryData;
  pins: TalisMapsPin[];
  mapCenter: [number, number] | undefined;
  mapZoom: number;
  videoUrl: string | null;
  galleryImages: string[];
  createdAt: string;
  updatedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  atlistMapUrl: string | null;
  pinLabel: string;
  overlayImageUrl: string | null;
}

const DEFAULT_PIN_COLOR = "#6B7280";
const DEFAULT_MAP_ZOOM = 15;

function isVideoUrl(url: string): boolean {
  const value = url.trim().toLowerCase();
  if (!value) return false;
  return (
    value.endsWith(".mp4") ||
    value.endsWith(".webm") ||
    value.endsWith(".mov") ||
    value.includes("youtube.com") ||
    value.includes("youtu.be") ||
    value.includes("vimeo.com")
  );
}

function toEmbedVideoUrl(url: string): string {
  const value = url.trim();
  const youtubeMatch = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const vimeoMatch = value.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return value;
}

function resolveLogoUrl(mapsite: MapSiteView): string {
  const logo = mapsite.logoUrl?.trim();
  if (!logo || logo === "/logo.png") {
    return MAPSITE_HEADER_FALLBACK_LOGO;
  }
  return logo;
}

export function getPrimaryPin(pins: MapSitePinView[]): MapSitePinView | null {
  if (pins.length === 0) return null;
  return pins.find((pin) => pin.featured) || pins[0];
}

function toTalisMapsPin(pin: MapSitePinView): TalisMapsPin {
  return {
    id: pin.id,
    name: pin.name,
    description: pin.description,
    categoryId: null,
    categorySlug: null,
    categoryName: null,
    categoryColor: DEFAULT_PIN_COLOR,
    latitude: pin.latitude,
    longitude: pin.longitude,
    address: pin.address,
    city: pin.city,
    province: pin.province,
    postalCode: pin.postalCode,
    country: pin.country,
    website: pin.website,
    phone: pin.phone,
    email: pin.email,
    featured: pin.featured,
    sortOrder: pin.sortOrder,
  };
}

function resolveGalleryImages(mapsite: MapSiteView): string[] {
  const explicit = mapsite.galleryImages.filter(Boolean);
  if (explicit.length > 0) {
    return explicit;
  }

  const derived = [
    mapsite.profileImageUrl,
    mapsite.logoUrl,
    mapsite.headerImageUrl,
  ].filter((url): url is string => Boolean(url?.trim()));

  return [...new Set(derived)];
}

function resolveVideoUrl(
  mapsite: MapSiteView,
  primaryPin: MapSitePinView | null
): string | null {
  if (mapsite.videoUrl?.trim()) {
    return toEmbedVideoUrl(mapsite.videoUrl);
  }

  if (primaryPin?.website && isVideoUrl(primaryPin.website)) {
    return toEmbedVideoUrl(primaryPin.website);
  }

  return null;
}

function resolveMapCenter(
  mapsite: MapSiteView,
  primaryPin: MapSitePinView | null
): [number, number] | undefined {
  if (
    mapsite.latitude != null &&
    mapsite.longitude != null &&
    Number.isFinite(mapsite.latitude) &&
    Number.isFinite(mapsite.longitude)
  ) {
    return [mapsite.latitude, mapsite.longitude];
  }

  if (primaryPin) {
    return [primaryPin.latitude, primaryPin.longitude];
  }

  return undefined;
}

export function buildMapSiteLayoutData(mapsite: MapSiteView): MapSiteLayoutData {
  const primaryPin = getPrimaryPin(mapsite.pins);
  const ownerName = `${mapsite.ownerFirstName} ${mapsite.ownerLastName}`.trim();
  const agentName = mapsite.agentName?.trim() || ownerName;
  const propertyTitle =
    mapsite.propertyTitle?.trim() ||
    primaryPin?.name?.trim() ||
    agentName;

  const talisPins =
    mapsite.pins.length > 0
      ? mapsite.pins.map(toTalisMapsPin)
      : resolveMapCenter(mapsite, primaryPin)
        ? [
            {
              id: "mapsite-center",
              name: propertyTitle,
              description: mapsite.propertyDescription || "",
              categoryId: null,
              categorySlug: null,
              categoryName: null,
              categoryColor: DEFAULT_PIN_COLOR,
              latitude: resolveMapCenter(mapsite, primaryPin)![0],
              longitude: resolveMapCenter(mapsite, primaryPin)![1],
              address: mapsite.propertyAddress || "",
              city: primaryPin?.city || "",
              province: primaryPin?.province || "",
              postalCode: primaryPin?.postalCode || "",
              country: primaryPin?.country || "",
              website: mapsite.website || primaryPin?.website || "",
              phone: mapsite.phone || primaryPin?.phone || "",
              email: mapsite.email || primaryPin?.email || "",
              featured: true,
              sortOrder: 0,
            },
          ]
        : [];

  return {
    id: mapsite.id,
    fastCode: mapsite.fastCode,
    accountType: mapsite.accountType,
    status: mapsite.status,
    slug: mapsite.slug,
    propertyTitle,
    logoUrl: resolveLogoUrl(mapsite),
    headerImageUrl: mapsite.headerImageUrl,
    agent: {
      name: agentName,
      firstName: mapsite.ownerFirstName,
      lastName: mapsite.ownerLastName,
      email: mapsite.email,
      phone: mapsite.phone,
      profileImageUrl: mapsite.profileImageUrl,
    },
    summary: {
      description:
        mapsite.propertyDescription?.trim() || primaryPin?.description || "",
      address: mapsite.propertyAddress?.trim() || primaryPin?.address || "",
      city: primaryPin?.city || "",
      province: primaryPin?.province || "",
      postalCode: primaryPin?.postalCode || "",
      country: primaryPin?.country || "",
      website: mapsite.website?.trim() || primaryPin?.website || "",
      phone: mapsite.phone || primaryPin?.phone || "",
      email: mapsite.email || primaryPin?.email || "",
      price: mapsite.price,
    },
    pins: talisPins,
    mapCenter: resolveMapCenter(mapsite, primaryPin),
    mapZoom: mapsite.mapZoom ?? DEFAULT_MAP_ZOOM,
    videoUrl: resolveVideoUrl(mapsite, primaryPin),
    galleryImages: resolveGalleryImages(mapsite),
    createdAt: mapsite.createdAt,
    updatedAt: mapsite.updatedAt,
    metaTitle: mapsite.metaTitle,
    metaDescription: mapsite.metaDescription,
    ogImageUrl: mapsite.ogImageUrl,
    atlistMapUrl: mapsite.atlistMapUrl?.trim() || null,
    pinLabel:
      primaryPin?.name?.trim() || mapsite.fastCode.toUpperCase(),
    overlayImageUrl:
      mapsite.headerImageUrl ||
      mapsite.galleryImages[0] ||
      null,
  };
}
