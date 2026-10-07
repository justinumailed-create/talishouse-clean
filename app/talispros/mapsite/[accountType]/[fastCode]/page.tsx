import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import {
  allpinsSeoCopy,
  mapsiteOgMetadataImage,
  mapsiteRealtimeSeoCopy,
  resolveMapSiteOgImage,
} from "@/lib/talispros/mapsite-og-image";
import { loadMapsiteSeoFields } from "@/lib/talispros/load-mapsite-seo-fields";
import { resolveBrandedMapSiteOgImage } from "@/lib/talispros/mapsite-branding-service";
import {
  parseRegistrationMarket,
  type RegistrationMarket,
} from "@/lib/registration-market";
import {
  accountTypeForAudience,
  type MapSiteCapabilityAccountType,
} from "@/lib/talispros/account-capabilities";
import {
  mapsiteAccountTypeSegment,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";
import { getMapSiteEditToolbarState, isOwnMapSite } from "@/lib/mapsite-edit-auth";
import { loadMapSiteOwnerCustomizations } from "@/lib/talispros/mapsite-owner-customizations-service";
import {
  loadMapSiteApplicationState,
  resolveMapSitePaymentPlanType,
  resolveMapSiteRequestId,
  getMapSiteActivationPaymentStatus,
} from "../../actions";
import { shouldReconcileClaimedMapSiteFromStripe } from "@/lib/talispros/mapsite-payment";
import { getMapSiteEbookContext, resolveEbookListingImageUrls } from "@/lib/talisbooks/mapsite-ebook-service";
import { ROUTES } from "@/lib/routes";
import { DEMO_PINNED_EBOOK_HREF, isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { ACTIVATE_QUERY, BOOK_PENDING_QUERY, CHECKOUT_QUERY, CHECKOUT_SESSION_QUERY, parseCheckoutSessionId, parseCheckoutStatus } from "@/lib/talispros/ebook-choice";
import {
  PIN_CHECKOUT_QUERY,
  PIN_CHECKOUT_SESSION_QUERY,
  parsePinCheckoutSessionId,
  parsePinCheckoutStatus,
} from "@/lib/talispros/mapsite-additional-pins";
import { loadMapSitePinDashboard } from "@/lib/talispros/mapsite-additional-pins-service";
import { withEbookListingMedia } from "@/lib/talispros/mapsite-listing-media";
import MapSiteApplication from "@/components/talispros/mapsite/MapSiteApplication";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ accountType: string; fastCode: string }>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isTruthyParam(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function audienceForAccountTypeSegment(segment: string): RegistrationMarket {
  const market = parseRegistrationMarket(segment);
  if (market) return market;
  if (segment === "root") return "brokers";
  if (segment === "derivative") return "listings";
  if (segment === "adpro") return "adpro";
  if (segment === "fsbo" || segment === "fsbos") return "fsbos";
  return "listings";
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { accountType, fastCode } = await params;
  const code = fastCode.trim().toUpperCase();
  const path = `${MAPSITE_APP_PATH}/${mapsiteAccountTypeSegment(accountType)}/${fastCode.trim().toLowerCase()}`;
  const ogImage = isAllPinsFastCode(fastCode)
    ? resolveMapSiteOgImage(fastCode)
    : await resolveBrandedMapSiteOgImage(fastCode);

  if (isAllPinsFastCode(fastCode)) {
    const copy = allpinsSeoCopy();
    return createMetadata({
      title: copy.title,
      description: copy.description,
      path,
      image: mapsiteOgMetadataImage(ogImage, copy.title),
    });
  }

  const fields = await loadMapsiteSeoFields(fastCode);
  const live = mapsiteRealtimeSeoCopy({
    fastCode: code,
    propertyTitle: fields?.propertyTitle,
    propertyDescription: fields?.propertyDescription,
    propertyAddress: fields?.propertyAddress,
  });
  const title = fields?.metaTitle?.trim() || live.title;
  const description = fields?.metaDescription?.trim() || live.description;
  return createMetadata({
    title,
    description,
    path,
    image: mapsiteOgMetadataImage(ogImage, title),
  });
}

/**
 * Short claimed Mapsite URL:
 * /talispros/mapsite/{accountType}/{fastCode}
 * e.g. /talispros/mapsite/listings/lg01
 */
export default async function ClaimedMapSiteByAccountTypePage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { accountType: rawAccountType, fastCode: rawFastCode } = await params;
  const query = await searchParams;
  const accountType = mapsiteAccountTypeSegment(rawAccountType);
  const fastCode = rawFastCode?.trim() || "";

  if (!fastCode || fastCode.toLowerCase() === "demo") {
    notFound();
  }

  const showActivatePayment = isTruthyParam(firstParam(query[ACTIVATE_QUERY]));
  const checkoutStatus = parseCheckoutStatus(firstParam(query[CHECKOUT_QUERY]));
  const checkoutSessionId = parseCheckoutSessionId(
    firstParam(query[CHECKOUT_SESSION_QUERY]),
  );
  const pinCheckoutStatus = parsePinCheckoutStatus(
    firstParam(query[PIN_CHECKOUT_QUERY]),
  );
  const pinCheckoutSessionId = parsePinCheckoutSessionId(
    firstParam(query[PIN_CHECKOUT_SESSION_QUERY]),
  );
  const bookPending = isTruthyParam(firstParam(query[BOOK_PENDING_QUERY]));
  const bookSlug = firstParam(query.book)?.trim() || null;
  const onboardingMode: "self" | "assisted" = bookPending ? "assisted" : "self";

  const audience = audienceForAccountTypeSegment(accountType);
  const capabilityAccountType: MapSiteCapabilityAccountType =
    accountTypeForAudience(audience);
  const requestIdParam = firstParam(query.requestId);
  const mapsiteIdParam = firstParam(query.mapsiteId);
  const requestId =
    (await resolveMapSiteRequestId({
      requestId: requestIdParam,
      fastCode,
      mapsiteId: mapsiteIdParam,
    })) || null;

  if (isAllPinsFastCode(fastCode)) {
    // ALLPINS map view is the live /talisu/mkts Markets map (not an empty aggregate).
    redirect(ROUTES.TALISU_MARKETS);
  }

  const mapsite = await loadMapSiteApplicationState({
    mapsiteId: mapsiteIdParam,
    fastCode,
    requestId,
    claimed: true,
  });

  const forceOpenPin =
    firstParam(query.view)?.trim().toLowerCase() === "pin" ||
    bookPending ||
    Boolean(bookSlug) ||
    showActivatePayment ||
    Boolean(checkoutStatus);
  // Real owner/paid browser session (not forceOpenPin query shortcuts).
  const isOwner = await isOwnMapSite(fastCode);

  const paymentPlanType = await resolveMapSitePaymentPlanType({
    requestId,
    fastCode,
    mapsiteId: mapsite.id,
  });

  const demoFastCode =
    isDemoMapSiteCode(mapsite.fast_code) || isDemoMapSiteCode(fastCode);
  const treatAsDemoUnlock =
    (mapsite.is_demonstration || demoFastCode) && !isIssuedFastCode(fastCode);

  const paymentReceived =
    treatAsDemoUnlock ||
    (
      await getMapSiteActivationPaymentStatus({
        mapsiteId: mapsite.id,
        fastCode,
        requestId,
        stripeCheckoutSessionId: checkoutSessionId,
        reconcileFromStripe: shouldReconcileClaimedMapSiteFromStripe({
          isDemo: treatAsDemoUnlock,
          mapsiteStatus: mapsite.status,
          checkoutSessionId,
          checkoutStatus,
        }),
      })
    ).paid;

  // Paid claimed Mapsites always surface pin dashboard resources (URL/MLS/TEB/TTV).
  // Owner session still gates Logout / owner-only chrome.
  const openPinOnLoad = forceOpenPin || isOwner || paymentReceived;

  const [ebookContext, pinDashboard, ownerCustomizations, editAccess] = await Promise.all([
    getMapSiteEbookContext(fastCode, {
      bookSlug,
    }),
    loadMapSitePinDashboard(mapsite.id),
    loadMapSiteOwnerCustomizations(mapsite.id),
    fastCode
      ? getMapSiteEditToolbarState(fastCode).catch(() => null)
      : Promise.resolve(null),
  ]);
  // Dashboard dropdown: owner session, or a Mapsite admin (e.g. FAST Code ARUN).
  // Paid + non-demo is enforced client-side (dashboardUnlocked) and in every action.
  const canManageDashboard = isOwner || Boolean(editAccess?.isAdmin);
  const primarySlug = ebookContext?.primaryEbook?.slug || bookSlug;
  const talisBookHref =
    (primarySlug ? `${ROUTES.TALISBOOKS_VIEWER}/${primarySlug}` : null) ||
    mapsite.teb_url?.trim() ||
    (treatAsDemoUnlock ? DEMO_PINNED_EBOOK_HREF : null);
  const hasTalisBook = Boolean(talisBookHref || ebookContext?.books?.length);
  const listingImageUrls = await resolveEbookListingImageUrls({
    listingImageUrls: ebookContext?.primaryEbook?.listingImageUrls,
    bookSlug: primarySlug,
    tebUrl: mapsite.teb_url,
  });
  const listingMapSite = withEbookListingMedia(
    {
      ...mapsite,
      fast_code: mapsite.fast_code || fastCode.toUpperCase(),
    },
    listingImageUrls,
    { hideSecondInterior: paymentReceived },
  );

  return (
    <MapSiteApplication
      initialMapSite={listingMapSite}
      audience={audience}
      accountType={capabilityAccountType}
      onboardingMode={onboardingMode}
      requestId={requestId}
      paymentPlanType={paymentPlanType}
      paymentReceived={paymentReceived}
      hasTalisBook={hasTalisBook}
      talisBookHref={talisBookHref}
      showActivatePayment={showActivatePayment}
      checkoutStatus={checkoutStatus}
      checkoutSessionId={checkoutSessionId}
      openPinOnLoad={openPinOnLoad}
      isOwner={isOwner}
      accountTypeSegment={accountType}
      showStartHere={false}
      flagIdentity={ebookContext?.primaryEbook?.flagIdentity}
      flagName={ebookContext?.primaryEbook?.flagName}
      initialPinDashboard={pinDashboard}
      pinCheckoutStatus={pinCheckoutStatus}
      pinCheckoutSessionId={pinCheckoutSessionId}
      canManageDashboard={canManageDashboard}
      initialOwnerCustomizations={ownerCustomizations}
    />
  );
}
