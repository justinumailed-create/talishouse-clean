import type { MapSiteView } from "@/lib/mapsite-service";
import { loadPublishedMapSiteView } from "@/components/mapsite/PublishedMapSiteView";
import { resolveClaimedMapSiteAccountTypeSegment } from "@/app/talispros/mapsites/actions";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import {
  demoMapSiteApplicationHref,
  isDemoMapSiteCode,
} from "@/lib/talispros/demo-mapsite";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { accountTypeForAudience } from "@/lib/talispros/account-capabilities";
import { HOME_OWNERSHIP_BG_SRC } from "@/lib/talispros/ownership-models";
import {
  fillPersonalHomeCopy,
  personalHomeDefaultImage,
  personalHomeDisplayName,
  personalHomePath,
  resolvePersonalHome,
  type PersonalHomeContent,
  type PersonalHomeDefaults,
  type ResolvedPersonalHome,
} from "@/lib/talispros/personal-home";
import { loadPersonalHomeContent } from "@/lib/talispros/personal-home-service";

/**
 * Builder / claim status lines stored as the Mapsite description (e.g. the
 * "FAST Code issued" or demonstration notes) are not an owner write-up, so
 * the localized default write-up is used instead.
 */
export function isSystemMapSiteDescription(value: string | null | undefined): boolean {
  const text = value?.trim() || "";
  if (!text) return true;
  return (
    /fast code(™)? (is )?issued/i.test(text) ||
    /no fast code/i.test(text) ||
    /^demonstration mapsite/i.test(text) ||
    /^claimed mapsite\b/i.test(text)
  );
}

/** Claim Your Market™ registration (a new market for this account holder). */
export function personalHomeClaimMarketHref(audience?: string | null): string {
  const market = parseRegistrationMarket(audience);
  if (!market) return "/talispros/markets/claim-a-market";
  const params = new URLSearchParams({
    audience: market,
    accountType: accountTypeForAudience(market),
  });
  return `/talispros/markets/claim-a-market?${params.toString()}`;
}

export type PersonalHomePageData = {
  view: MapSiteView;
  /** Lower-case FAST Code (route param form). Never rendered as copy. */
  code: string;
  isDemo: boolean;
  homeHref: string;
  mapsiteHref: string;
  displayName: string;
  defaults: PersonalHomeDefaults;
  saved: PersonalHomeContent;
  resolved: ResolvedPersonalHome;
};

export type PersonalHomeLookup =
  | { kind: "ok"; data: PersonalHomePageData }
  | { kind: "allpins" }
  | { kind: "missing" };

/** Where "Mapsite" points for this account (claimed path, or the demo app). */
export async function personalHomeMapsiteHref(view: MapSiteView): Promise<string> {
  const code = view.fastCode.trim().toLowerCase();
  if (isDemoMapSiteCode(code)) {
    return demoMapSiteApplicationHref(view.id, code);
  }
  const accountType = await resolveClaimedMapSiteAccountTypeSegment({
    fastCode: code,
    mapsiteId: view.id,
  });
  return buildClaimedMapSitePath({ fastCode: code, accountType });
}

function defaultsFor(
  view: MapSiteView,
  locale: Locale,
  mapsiteHref: string,
  isDemo: boolean,
): { defaults: PersonalHomeDefaults; displayName: string } {
  const copy = getDictionary(locale).personalHome;
  const displayName = personalHomeDisplayName({
    ownerFirstName: view.ownerFirstName,
    ownerLastName: view.ownerLastName,
    agentName: view.agentName,
    propertyTitle: view.propertyTitle,
    fallback: copy.fallbackName,
  });
  const address = view.propertyAddress?.trim() || "";
  const description = isSystemMapSiteDescription(view.propertyDescription)
    ? ""
    : view.propertyDescription?.trim() || "";
  const writeUp =
    description ||
    (address
      ? fillPersonalHomeCopy(copy.defaultWriteUpWithAddress, { address })
      : copy.defaultWriteUp);
  return {
    displayName,
    defaults: {
      imageUrl: personalHomeDefaultImage({
        profileImageUrl: view.profileImageUrl,
        headerImageUrl: view.headerImageUrl,
        galleryImages: view.galleryImages,
        fallback: HOME_OWNERSHIP_BG_SRC,
      }),
      kicker: view.brokerageName?.trim() || copy.kicker,
      headline: displayName,
      writeUp,
      buttons: [
        { label: copy.openMapsite, href: mapsiteHref },
        {
          label: copy.claimMarket,
          // A demonstration is claimed in place on its own Mapsite.
          href: isDemo ? mapsiteHref : personalHomeClaimMarketHref(view.claimAudience),
        },
      ],
    },
  };
}

export async function loadPersonalHomePage(
  rawCode: string,
  locale: Locale,
): Promise<PersonalHomeLookup> {
  const code = decodeURIComponent(rawCode || "").trim().toLowerCase();
  if (!code || code.length > 64) return { kind: "missing" };
  if (isAllPinsFastCode(code)) return { kind: "allpins" };

  const view = await loadPublishedMapSiteView(code);
  if (!view) return { kind: "missing" };

  const isDemo = isDemoMapSiteCode(code);
  const [mapsiteHref, saved] = await Promise.all([
    personalHomeMapsiteHref(view),
    loadPersonalHomeContent(code),
  ]);
  const { defaults, displayName } = defaultsFor(view, locale, mapsiteHref, isDemo);
  return {
    kind: "ok",
    data: {
      view,
      code,
      isDemo,
      homeHref: personalHomePath(code),
      mapsiteHref,
      displayName,
      defaults,
      saved,
      resolved: resolvePersonalHome(defaults, saved),
    },
  };
}

/** Owner edit gate: owner session (FAST Code entry), root account, or admin. */
export async function canEditPersonalHome(code: string): Promise<boolean> {
  if (!code || isDemoMapSiteCode(code) || isAllPinsFastCode(code)) return false;
  try {
    const state = await getMapSiteEditToolbarState(code);
    return Boolean(state.showToolbar);
  } catch {
    return false;
  }
}
