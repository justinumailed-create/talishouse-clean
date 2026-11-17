import { getSignedContractForFastCode } from "@/lib/talispros/mapsite-contract-service";
import { getLocale } from "@/lib/i18n/server";
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
import {
  reconcileMapSiteStripeForViewer,
  shouldReconcileClaimedMapSiteFromStripe,
} from "@/lib/talispros/mapsite-payment";
import { getMapSiteEbookContext, resolveEbookListingImageUrls } from "@/lib/talisbooks/mapsite-ebook-service";
import { ROUTES } from "@/lib/routes";
import { DEMO_PINNED_EBOOK_HREF, isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { personalHomePath } from "@/lib/talispros/personal-home";
import { loadPersonalHomeOwnerPill } from "@/lib/talispros/personal-home-page";
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
import MapSitePartnerButtons, {
  type MapSitePartnerTarget,
} from "@/components/talispros/mapsite/MapSitePartnerButtons";
import { loadMapSiteRootContext } from "@/lib/talispros/mapsite-root-partners-service";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { isPreparedSlotMapsite } from "@/lib/talispros/fast-code-slots-server";
import { readMapZoomExplicit } from "@/lib/talispros/system-mapsite-zoom-server";
import { hasProspectAccess } from "@/lib/talispros/prospect-gate-server";
import { loadOwnTebViewerHref } from "@/lib/talisbooks/own-teb-href";
import { isFastCodeDisqualified } from "@/lib/talispros/market-disqualify-server";

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
      locale: await getLocale(),
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
      locale: await getLocale(),
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
  if (isAllPinsFastCode(fastCode)) {
    // ALLPINS map view is the live /talisu/mkts Markets map (not an empty aggregate).
    redirect(ROUTES.TALISU_MARKETS);
  }

  const [disqualified, requestIdResolved] = await Promise.all([
    isFastCodeDisqualified(fastCode),
    resolveMapSiteRequestId({
      requestId: requestIdParam,
      fastCode,
      mapsiteId: mapsiteIdParam,
    }),
  ]);
  if (disqualified) {
    const owner = await isOwnMapSite(fastCode).catch(() => false);
    if (!owner) notFound();
  }
  const requestId = requestIdResolved || null;

  const mapsite = await loadMapSiteApplicationState({
    mapsiteId: mapsiteIdParam,
    fastCode,
    requestId,
    claimed: true,
  });

  const demoFastCode =
    isDemoMapSiteCode(mapsite.fast_code) || isDemoMapSiteCode(fastCode);
  const treatAsDemoUnlock =
    (mapsite.is_demonstration || demoFastCode) && !isIssuedFastCode(fastCode);
  const checkoutReconcile =
    Boolean(checkoutSessionId) || checkoutStatus === "success";
  const stripeOptions = {
    isDemo: treatAsDemoUnlock,
    mapsiteStatus: mapsite.status,
    checkoutSessionId,
    checkoutStatus,
  };

  // These reads do not depend on each other. Start them together so the
  // Mapsite pays one round trip to Supabase instead of a chain.
  const preparedSlotPromise = isPreparedSlotMapsite(mapsite.id);
  const planPromise = resolveMapSitePaymentPlanType({
    requestId,
    fastCode,
    mapsiteId: mapsite.id,
  });
  const ebookPromise = getMapSiteEbookContext(fastCode, { bookSlug });
  const pinPromise = loadMapSitePinDashboard(mapsite.id);
  const customPromise = loadMapSiteOwnerCustomizations(mapsite.id);
  const editPromise = fastCode
    ? getMapSiteEditToolbarState(fastCode).catch(() => null)
    : Promise.resolve(null);
  const rootPromise = loadMapSiteRootContext({
    mapsiteId: mapsite.id,
    fastCode: mapsite.fast_code || fastCode,
  });
  const zoomPromise = readMapZoomExplicit(mapsite.id);
  const tebPromise = loadOwnTebViewerHref(mapsite.fast_code || fastCode);
  const localePromise = getLocale();
  const paymentPromise = treatAsDemoUnlock
    ? Promise.resolve({ paid: true })
    : getMapSiteActivationPaymentStatus({
        mapsiteId: mapsite.id,
        fastCode,
        requestId,
        stripeCheckoutSessionId: checkoutSessionId,
        reconcileFromStripe:
          checkoutReconcile && shouldReconcileClaimedMapSiteFromStripe(stripeOptions),
      });

  // Prospect FAST Codes open only behind the agent password gate (Arun, Nov 5).
  const preparedSlotMapsite = await preparedSlotPromise;
  if (preparedSlotMapsite && !(await hasProspectAccess())) {
    redirect(`${DEMO_MAPSITE_BUILD_PATH}?gate=${encodeURIComponent(fastCode.toLowerCase())}#fast-code-slots`);
  }

  // Real owner/paid browser session.
  const isOwner = await isOwnMapSite(fastCode);

  const [
    paymentPlanType,
    ebookContext,
    pinDashboard,
    ownerCustomizations,
    editAccess,
    rootContext,
    mapZoomExplicit,
    tebOwnBookHref,
    locale,
    initialPayment,
  ] = await Promise.all([
    planPromise,
    ebookPromise,
    pinPromise,
    customPromise,
    editPromise,
    rootPromise,
    zoomPromise,
    tebPromise,
    localePromise,
    paymentPromise,
  ]);

  let paymentReceived = initialPayment.paid;
  if (
    !paymentReceived &&
    reconcileMapSiteStripeForViewer({ ...stripeOptions, isOwner }) &&
    !checkoutReconcile
  ) {
    paymentReceived = (
      await getMapSiteActivationPaymentStatus({
        mapsiteId: mapsite.id,
        fastCode,
        requestId,
        stripeCheckoutSessionId: checkoutSessionId,
        reconcileFromStripe: true,
      })
    ).paid;
  }
  // Dashboard dropdown: owner session, or a Mapsite admin (e.g. FAST Code ARUN).
  // Paid + non-demo is enforced client-side (dashboardUnlocked) and in every action.
  const canManageDashboard = isOwner || Boolean(editAccess?.isAdmin);
  const primarySlug = ebookContext?.primaryEbook?.slug || bookSlug;
  const talisBookHref =
    (primarySlug ? `${ROUTES.TALISBOOKS_VIEWER}/${primarySlug}` : null) ||
    mapsite.teb_url?.trim() ||
    (treatAsDemoUnlock ? DEMO_PINNED_EBOOK_HREF : null);
  const hasTalisBook = Boolean(talisBookHref || ebookContext?.books?.length);
  const [listingImageUrls, contractRow, ownerPill] = await Promise.all([
    resolveEbookListingImageUrls({
      listingImageUrls: ebookContext?.primaryEbook?.listingImageUrls,
      bookSlug: primarySlug,
      tebUrl: mapsite.teb_url,
    }),
    paymentReceived || !showActivatePayment
      ? Promise.resolve(true)
      : getSignedContractForFastCode(mapsite.fast_code || fastCode).then(Boolean),
    loadPersonalHomeOwnerPill(fastCode, locale),
  ]);
  const contractSigned = paymentReceived || !showActivatePayment || contractRow;
  // The PIN card opens only when a PIN is clicked. Explicit deep links
  // (?view=pin, a pending book) still open it; selling tools live in the navbar.
  const openPinOnLoad =
    firstParam(query.view)?.trim().toLowerCase() === "pin" || bookPending;
  const listingMapSite = withEbookListingMedia(
    {
      ...mapsite,
      fast_code: mapsite.fast_code || fastCode.toUpperCase(),
      teb_own_book_href: tebOwnBookHref,
      url1_opens_broker_url: preparedSlotMapsite,
    },
    listingImageUrls,
    { hideSecondInterior: paymentReceived },
  );

  // PIN categories + Partner Mapsites (Root shows its Derivatives' PINs).
  const partnerTargets: MapSitePartnerTarget[] = rootContext.partners.map((partner) => ({
    fastCode: partner.fastCode,
    href: partner.href,
    title: partner.title,
    relation: partner.relation,
  }));

  // PMC gate: activation payment only after the Service Agreement is signed
  // for this FAST Code. Paid / demo Mapsites are never gated.

  return (
    <>
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
      contractSigned={contractSigned}
      checkoutStatus={checkoutStatus}
      checkoutSessionId={checkoutSessionId}
      openPinOnLoad={openPinOnLoad}
      mapZoomExplicit={mapZoomExplicit}
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
      initialRootContext={rootContext}
      personalHomeNav={{
        homeHref: personalHomePath(fastCode),
        mapsiteHref: `${MAPSITE_APP_PATH}/${accountType}/${fastCode.toLowerCase()}`,
        owner: ownerPill,
      }}
    />
    <MapSitePartnerButtons partners={partnerTargets} />
    </>
  );
}

