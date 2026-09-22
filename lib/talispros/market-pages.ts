import type { RegistrationMarket } from "@/lib/registration-market";

export interface TalisprosMarketPageContent {
  slug: string;
  title: string;
  registrationMarket: RegistrationMarket;
  marketPartner: string;
  partnerImage: string;
  partnerImageAlt: string;
  whyHeading: string;
  whyBody: string;
  metadataTitle: string;
}

export const MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE =
  "/images/mapsites/aisha-c.webp";

export function mapsiteMarketPartnerImageUrl(
  assignedPartnerImageUrl?: string | null,
  fallback: string = MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE,
): string {
  return assignedPartnerImageUrl?.trim() || fallback;
}

export const MAPSITE_MARKET_PARTNER_FALLBACK_NAME = "Aisha C.";

export const MARKETING_PARTNER_ROLE_LABEL = "Marketing Partner";

export function mapsiteMarketPartnerLabel(
  agentImageUrl?: string | null,
  agentName?: string | null,
  fallback: string = MARKETING_PARTNER_ROLE_LABEL,
): string {
  const image = agentImageUrl?.trim() || "";
  const name = agentName?.trim() || "";
  if (image && name) {
    return `${MARKETING_PARTNER_ROLE_LABEL}: ${name}`;
  }
  return fallback;
}

export const REAL_ESTATE_PROFESSIONALS_MARKET: TalisprosMarketPageContent = {
  slug: "real-estate-professionals",
  title: "Real Estate Professionals",
  registrationMarket: "listings",
  marketPartner: "Marketing Partner",
  partnerImage: MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE,
  partnerImageAlt: "Aisha C.",
  whyHeading: "Why Real Estate Professionals might use Mapsites™.",
  whyBody:
    "Mapsites™ encourage listing qualification based upon service floors: minimum real estate fees and/or term lengths for inclusion. In that context reward structures, including real estate fees, experience upward pressure over time. Consequently, Mapsites™ pay for themselves, even when engaging in neither advertising, nor referral and co-promotion strategies.",
  metadataTitle: "Talispros™ | Under Construction...",
};

export const TALISHHOUSE_BUILDERS_MARKET: TalisprosMarketPageContent = {
  slug: "talishouse-builders",
  title: "Talishouse™ Builders",
  registrationMarket: "homes",
  marketPartner: "Marketing Partner",
  partnerImage: MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE,
  partnerImageAlt: "Aisha C.",
  whyHeading: "Why Talishouse™ Builders might use Mapsites™.",
  whyBody:
    "Mapsites™ enable personal promotion and object or project advertising and marketing on a proprietary platform not limited by Real Estate Trading Acts or industry, franchise or brokerage restrictions. Talishouse™ builders save expensive real estate licensing fees, but enjoy the benefits of map-based marketing that potential geographic, demographic and psychographic segmentation offers.",
  metadataTitle: "Talispros™ | Under Construction...",
};

export const FOR_SALE_BY_OWNERS_MARKET: TalisprosMarketPageContent = {
  slug: "for-sale-by-owners",
  title: "For Sale By Owners",
  registrationMarket: "fsbos",
  marketPartner: "Marketing Partner",
  partnerImage: MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE,
  partnerImageAlt: "Aisha C.",
  whyHeading: "Why For-Sale-By-Owners might use Mapsites™.",
  whyBody:
    "Selling real estate the traditional way is expensive and invasive. Selling privately is always an option, but your reach and adequate levels of publicity is typically difficult, when not professionally managed. Enter Talispros PMC: Rahul promotes via your own platform and as a professional advertiser, which spreads the word broadly and reliably. When you sell, you sell privately through your lawyer - no real estate fees become due.",
  metadataTitle: "Talispros™ | Under Construction...",
};

export const CLAIM_A_MARKET_PAGE: TalisprosMarketPageContent = {
  slug: "claim-a-market",
  title: "Build Mapsite™",
  registrationMarket: "listings",
  marketPartner: "Marketing Partner",
  partnerImage: MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE,
  partnerImageAlt: "Aisha C.",
  whyHeading: "Why build your Mapsite™.",
  whyBody:
    "Mapsite™ is the centre of Talispros™. Submit your Build Request here to receive a FAST Code™, create your first Talisbook™, and unlock MLS®, URL, TEB™, and TTV™ actions on your pin after activation — without leaving the map-first workflow.",
  metadataTitle: "Talispros™ | Build Mapsite™",
};

/** Same two-column Mapsite™ chrome as Build My Mapsite™ / market pages. */
export function isTalisprosMarketLayoutPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/talispros/markets/") ||
    pathname.startsWith("/talispros/build-mapsite/assisted")
  );
}
