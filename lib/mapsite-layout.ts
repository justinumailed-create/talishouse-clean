import type { MapSitePinView, MapSiteView } from "./mapsite-service";
import type { TalisMapsPin } from "./talismaps";
import type { OfferedSubscriptionTier } from "./mapsite-subscription";
import { parseOfferedSubscriptionTier } from "./mapsite-subscription";
import {
  toDisplayGalleryUrl,
  visibleGalleryDisplayItems,
  type MapSiteGalleryDisplayItem,
} from "./mapsite-gallery";
import { ROUTES } from "@/lib/routes";
import {
  MAPSITE_PIN_DEFAULT_COLOR,
  MAPSITE_PIN_DEFAULT_ICON,
  mapSitePinVisualFields,
  type MapSiteSavedPinStyle,
} from "@/lib/mapsite-pin-style";

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
  galleryItems: MapSiteGalleryDisplayItem[];
  galleryImages: string[];
  createdAt: string;
  updatedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  pinLabel: string;
  overlayImageUrl: string | null;
  offeredSubscriptionTier: OfferedSubscriptionTier;
  interestFormEnabled: boolean;
  tebHref: string;
  ttvHref: string;
  scheduleHref: string;
  brokerageName: string;
  brokerageLogoUrl: string | null;
  brokerageWebsite: string | null;
}

const DEFAULT_MAP_ZOOM = 15;
/** Same marker as the Build / Claim form PIN selector. */
export const MAPSITE_MAP_PIN_COLOR = MAPSITE_PIN_DEFAULT_COLOR;
export const MAPSITE_MAP_PIN_ICON = MAPSITE_PIN_DEFAULT_ICON;

function customOrFallbackHref(
  custom: string | null | undefined,
  fallback: string,
): string {
  const value = custom?.trim() || "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return fallback;
}

export function mapsiteTebHref(
  fastCode: string,
  _tebUrl?: string | null,
): string {
  const code = fastCode.trim().toLowerCase();
  return code ? `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(code)}` : ROUTES.TALISBOOKS;
}

export function mapsiteTtvHref(ttvUrl?: string | null): string {
  return customOrFallbackHref(ttvUrl, ROUTES.TALISTV);
}

export function mapsiteScheduleHref(fastCode: string): string {
  const code = fastCode.trim();
  return code
    ? `${ROUTES.TALISTV}?fastCode=${encodeURIComponent(code)}`
    : ROUTES.TALISTV;
}

export function mapsiteCreateEbookHref(
  fastCode: string,
  requestId?: string | null,
): string {
  const id = requestId?.trim() || "";
  if (id) {
    return `${ROUTES.TALISPROS_EBOOK_GENERATE}?requestId=${encodeURIComponent(id)}`;
  }
  const code = fastCode.trim().toLowerCase();
  return code
    ? `${ROUTES.TALISPROS_EBOOK_GENERATE}?fastCode=${encodeURIComponent(code)}`
    : ROUTES.TALISPROS_EBOOK_GENERATE;
}

export function mapsiteCreateContentHref(fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return code
    ? `/talispros/mapsites/${encodeURIComponent(code)}/edit`
    : "/talispros/mapsites";
}

export function mapsiteCreateVideoHref(fastCode: string): string {
  return mapsiteScheduleHref(fastCode);
}

export function mapsiteFullscreenMapHref(slug: string): string {
  const code = slug.trim().toLowerCase();
  return code ? `/mapsite/${encodeURIComponent(code)}/map` : "/mapsite";
}

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

function customBrokerageLogoUrl(mapsite: MapSiteView): string | null {
  const logo = mapsite.logoUrl?.trim() || "";
  if (!logo || logo === "/logo.png" || logo === MAPSITE_HEADER_FALLBACK_LOGO) {
    return null;
  }
  return logo;
}

export function resolveMapSiteBrokerageName(mapsite: MapSiteView): string {
  const company = mapsite.brokerageName?.trim();
  if (company) return company;
  const agent = mapsite.agentName?.trim();
  if (agent) return agent;
  return `${mapsite.ownerFirstName} ${mapsite.ownerLastName}`.trim();
}

/** Paid TTV™ card: name the owner's brokerage (company, else listing host). */

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

function mapsiteSavedPinStyle(mapsite: MapSiteView): MapSiteSavedPinStyle {
  return {
    pinIcon: mapsite.pinIcon,
    pinColor: mapsite.pinColor,
    pinBorder: mapsite.pinBorder,
    pinWhiteCenter: mapsite.pinWhiteCenter,
    pinAnimated: mapsite.pinAnimated,
    pinCategoryBadge: mapsite.pinCategoryBadge,
  };
}

function toTalisMapsPin(
  pin: MapSitePinView,
  tebHref: string,
  style: MapSiteSavedPinStyle,
): TalisMapsPin {
  const visual = mapSitePinVisualFields(style);
  return {
    id: pin.id,
    name: pin.name,
    description: pin.description,
    categoryId: null,
    categorySlug: null,
    categoryName: null,
    categoryColor: visual.categoryColor,
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
    pinIcon: visual.pinIcon,
    pinColor: visual.pinColor,
    pinBorder: visual.pinBorder,
    whiteCenter: visual.whiteCenter,
    pinAnimated: visual.pinAnimated,
    customLogoUrl: visual.customLogoUrl,
    href: tebHref,
    categoryBadge: visual.categoryBadge || (tebHref ? "TEB™" : null),
  };
}

function resolveGalleryImages(mapsite: MapSiteView): string[] {
  const explicit = visibleGalleryDisplayItems(mapsite.galleryItems).map(
    (item) => item.url
  );

  const derived = [
    mapsite.profileImageUrl,
    mapsite.logoUrl,
    mapsite.headerImageUrl,
  ]
    .filter((url): url is string => Boolean(url?.trim()))
    .map((url) => toDisplayGalleryUrl(url));

  const base = explicit.length > 0 ? explicit : derived;
  const unique = [...new Set(base)];

  const header = mapsite.headerImageUrl?.trim();
  if (!header) {
    return unique;
  }

  const displayHeader = toDisplayGalleryUrl(header);
  const remainder = unique.filter((url) => url !== displayHeader);
  return [displayHeader, ...remainder];
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
  const tebHref = mapsiteTebHref(mapsite.fastCode, mapsite.tebUrl);
  const pinStyle = mapsiteSavedPinStyle(mapsite);

  const talisPins =
    mapsite.pins.length > 0
      ? mapsite.pins.map((pin) => toTalisMapsPin(pin, tebHref, pinStyle))
      : resolveMapCenter(mapsite, primaryPin)
        ? [
            toTalisMapsPin(
              {
                id: "mapsite-center",
                name: propertyTitle,
                description: mapsite.propertyDescription || "",
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
              tebHref,
              pinStyle,
            ),
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
    galleryItems: visibleGalleryDisplayItems(mapsite.galleryItems),
    galleryImages: resolveGalleryImages(mapsite),
    createdAt: mapsite.createdAt,
    updatedAt: mapsite.updatedAt,
    metaTitle: mapsite.metaTitle,
    metaDescription: mapsite.metaDescription,
    ogImageUrl: mapsite.ogImageUrl,
    pinLabel:
      primaryPin?.name?.trim() || mapsite.fastCode.toUpperCase(),
    overlayImageUrl:
      mapsite.headerImageUrl ||
      visibleGalleryDisplayItems(mapsite.galleryItems)[0]?.url ||
      null,
    offeredSubscriptionTier: parseOfferedSubscriptionTier(
      mapsite.offeredSubscriptionTier
    ),
    interestFormEnabled: mapsite.interestFormEnabled,
    tebHref,
    ttvHref: mapsiteTtvHref(mapsite.ttvUrl),
    scheduleHref: mapsiteScheduleHref(mapsite.fastCode),
    brokerageName: resolveMapSiteBrokerageName(mapsite),
    brokerageLogoUrl: customBrokerageLogoUrl(mapsite),
    brokerageWebsite:
      mapsite.brokerUrl?.trim() || mapsite.website?.trim() || null,
  };
}
