import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { parseRegistrationMarket } from "@/lib/registration-market";
import {
  accountTypeForAudience,
  type MapSiteCapabilityAccountType,
} from "@/lib/talispros/account-capabilities";
import { getTalisprosAdminSession } from "@/lib/talispros-admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { listPmcRegionalPins } from "@/lib/talispros/pmc-pins-service";
import {
  buildClaimedMapSitePath,
  DEMO_MAPSITE_ID,
  MAPSITE_APP_PATH,
  mapsiteAccountTypeSegment,
} from "@/lib/talispros/mapsite-state";
import { isOwnMapSite } from "@/lib/mapsite-edit-auth";
import {
  loadMapSiteApplicationState,
  resolveMapSitePaymentPlanType,
  getMapSiteActivationPaymentStatus,
} from "./actions";
import { shouldReconcileClaimedMapSiteFromStripe } from "@/lib/talispros/mapsite-payment";
import { getMapSiteEbookContext, resolveEbookListingImageUrls } from "@/lib/talisbooks/mapsite-ebook-service";
import { ROUTES } from "@/lib/routes";
import { DEMO_PINNED_EBOOK_HREF, isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { ACTIVATE_QUERY, BOOK_PENDING_QUERY, CHECKOUT_QUERY, CHECKOUT_SESSION_QUERY, parseCheckoutSessionId, parseCheckoutStatus } from "@/lib/talispros/ebook-choice";
import { withEbookListingMedia } from "@/lib/talispros/mapsite-listing-media";
import MapSiteApplication from "@/components/talispros/mapsite/MapSiteApplication";
import MapSitePmcApplication from "@/components/talispros/mapsite/MapSitePmcApplication";
import MapSiteOnboardingEntry from "@/components/talispros/mapsite/MapSiteOnboardingEntry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Talispros™ Mapsite™",
  description:
    "Claim your market on the Talispros™ Mapsite™ — the fullscreen map application for FSBO, builders, and real estate professionals.",
  path: "/talispros/mapsite",
  image: false,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

export default async function TalisprosMapSitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audience =
    parseRegistrationMarket(firstParam(params.audience)) ?? "listings";
  const claimed = isTruthyParam(firstParam(params.claimed));
  const view = firstParam(params.view)?.trim().toLowerCase() ?? null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const fastCode =
    firstParam(params.fastCode)?.trim() ||
    firstParam(params.code)?.trim() ||
    null;
  const requestId = firstParam(params.requestId)?.trim() || null;
  const showStartHere = isTruthyParam(firstParam(params.startHere));
  const showActivatePayment = isTruthyParam(firstParam(params[ACTIVATE_QUERY]));
  const checkoutStatus = parseCheckoutStatus(firstParam(params[CHECKOUT_QUERY]));
  const checkoutSessionId = parseCheckoutSessionId(
    firstParam(params[CHECKOUT_SESSION_QUERY]),
  );
  const bookSlug = firstParam(params.book)?.trim() || null;
  const setup = firstParam(params.setup)?.trim().toLowerCase() ?? null;
  const sourceAudience =
    parseRegistrationMarket(firstParam(params.sourceAudience)) ?? null;

  // Prefer the short claimed URL: /talispros/mapsite/{accountType}/{fastCode}
  if (fastCode && (claimed || view === "pin" || requestId || mapsiteId)) {
    const redirectParams = new URLSearchParams();
    if (showStartHere) redirectParams.set("startHere", "1");
    if (showActivatePayment) redirectParams.set(ACTIVATE_QUERY, "1");
    if (checkoutStatus) redirectParams.set(CHECKOUT_QUERY, checkoutStatus);
    if (checkoutSessionId) {
      redirectParams.set(CHECKOUT_SESSION_QUERY, checkoutSessionId);
    }
    if (isTruthyParam(firstParam(params[BOOK_PENDING_QUERY]))) {
      redirectParams.set(BOOK_PENDING_QUERY, "1");
    }
    if (requestId) redirectParams.set("requestId", requestId);
    if (mapsiteId) redirectParams.set("mapsiteId", mapsiteId);
    if (bookSlug) redirectParams.set("book", bookSlug);
    const query = redirectParams.toString();
    redirect(
      `${buildClaimedMapSitePath({
        fastCode,
        audience: mapsiteAccountTypeSegment(audience),
      })}${query ? `?${query}` : ""}`
    );
  }

  // PMC multi-pin is brokers browse only. Any claim / FAST-code / pin view
  // must use the single-pin Mapsite™ (user pin + MLS/URL/TEB/TTV card).
  const showSinglePinMap =
    claimed ||
    view === "pin" ||
    Boolean(mapsiteId) ||
    Boolean(fastCode) ||
    Boolean(requestId);

  const isAudienceEntryPage = !showSinglePinMap;
  if (
    isAudienceEntryPage &&
    (audience === "brokers" ||
      audience === "listings" ||
      audience === "fsbos" ||
      audience === "adpro") &&
    setup !== "self" &&
    setup !== "assisted"
  ) {
    return <MapSiteOnboardingEntry audience={audience} />;
  }

  // Backward-compatible setup URLs now enter dedicated onboarding flows first.
  // Existing Mapsite™ visual/state route remains the post-build success state.
  if (isAudienceEntryPage && setup === "self") {
    const params = new URLSearchParams({
      audience,
      mapsiteId: DEMO_MAPSITE_ID,
      returnTo: MAPSITE_APP_PATH,
    });
    redirect(`/talispros/markets/claim-a-market?${params.toString()}`);
  }
  if (isAudienceEntryPage && setup === "assisted") {
    const params = new URLSearchParams({
      audience,
      setup: "assisted",
    });
    if (sourceAudience) {
      params.set("sourceAudience", sourceAudience);
    }
    redirect(`/talispros/build-mapsite/assisted?${params.toString()}`);
  }

  const onboardingMode: "self" | "assisted" =
    setup === "assisted" ? "assisted" : "self";
  const flowAudience = isAudienceEntryPage ? "listings" : audience;
  const accountType: MapSiteCapabilityAccountType =
    accountTypeForAudience(flowAudience);

  if (flowAudience === "brokers" && !showSinglePinMap) {
    const [pins, adminSession, marketingManager] = await Promise.all([
      listPmcRegionalPins(),
      getTalisprosAdminSession(),
      isMarketingManagerAuthenticated(),
    ]);

    return (
      <MapSitePmcApplication
        pins={pins}
        audience={flowAudience}
        canEdit={Boolean(adminSession) || marketingManager}
      />
    );
  }

  const mapsite = await loadMapSiteApplicationState({
    mapsiteId,
    fastCode,
    requestId,
    claimed: claimed || view === "pin" || Boolean(requestId),
  });

  const ownerCode = mapsite.fast_code || fastCode;
  const isDemoListing =
    (mapsite.is_demonstration || isDemoMapSiteCode(mapsite.fast_code)) &&
    !isIssuedFastCode(fastCode) &&
    !isIssuedFastCode(ownerCode);
  let isOwner = isDemoListing || showStartHere;
  if (!isOwner) {
    try {
      isOwner = await isOwnMapSite(ownerCode);
    } catch (error) {
      console.warn("[mapsite] Could not resolve owner session:", error);
    }
  }

  const paymentPlanType = await resolveMapSitePaymentPlanType({
    requestId,
    fastCode,
    mapsiteId: mapsite.id,
  });

  const paymentReceived =
    isDemoListing ||
    (
      await getMapSiteActivationPaymentStatus({
        mapsiteId: mapsite.id,
        fastCode,
        requestId,
        stripeCheckoutSessionId: checkoutSessionId,
        reconcileFromStripe: shouldReconcileClaimedMapSiteFromStripe({
          isDemo: isDemoListing,
          mapsiteStatus: mapsite.status,
          checkoutSessionId,
          checkoutStatus,
        }),
      })
    ).paid;

  const ebookContext = ownerCode
    ? await getMapSiteEbookContext(ownerCode, { bookSlug })
    : null;
  const primarySlug = ebookContext?.primaryEbook?.slug || bookSlug;
  const talisBookHref =
    (primarySlug ? `${ROUTES.TALISBOOKS_VIEWER}/${primarySlug}` : null) ||
    mapsite.teb_url?.trim() ||
    (isDemoListing ? DEMO_PINNED_EBOOK_HREF : null);
  const hasTalisBook = Boolean(talisBookHref || ebookContext?.books?.length);
  let listingImageUrls: string[] = [];
  try {
    listingImageUrls = await resolveEbookListingImageUrls({
      listingImageUrls: ebookContext?.primaryEbook?.listingImageUrls,
      bookSlug: primarySlug,
      tebUrl: mapsite.teb_url,
    });
  } catch (error) {
    console.warn("[mapsite] Could not resolve ebook listing images:", error);
  }
  const listingMapSite = withEbookListingMedia(
    mapsite,
    listingImageUrls,
  );

  return (
    <MapSiteApplication
      initialMapSite={listingMapSite}
      audience={flowAudience}
      accountType={accountType}
      onboardingMode={onboardingMode}
      sourceAudience={sourceAudience}
      requestId={requestId}
      paymentPlanType={paymentPlanType}
      paymentReceived={paymentReceived}
      hasTalisBook={hasTalisBook}
      talisBookHref={talisBookHref}
      showActivatePayment={showActivatePayment}
      checkoutStatus={checkoutStatus}
      checkoutSessionId={checkoutSessionId}
      openPinOnLoad={isOwner || claimed || view === "pin"}
      showStartHere={false}
    />
  );
}
