"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { PlanType } from "@/lib/registration-plans";
import {
  MAPSITE_MIN_CARD_HEIGHT_PX,
  MAPSITE_PIN_TIP_CLEARANCE_PX,
  MAPSITE_POPUP_TIP_HEIGHT_PX,
  computeMapSiteOverlayLayout,
} from "@/lib/talispros/mapsite-overlay-layout";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { MAPSITE_LISTING_TILE_TOP_FALLBACK_PX } from "@/lib/talispros/mapsite-listing-media";
import {
  accountTypeForAudience,
  type MapSiteCapabilityAccountType,
} from "@/lib/talispros/account-capabilities";
import {
  isClaimable,
  MAPSITE_APP_PATH,
  pinPhaseLabel,
} from "@/lib/talispros/mapsite-state";
import {
  getMapSiteOnboardingPhase,
} from "@/lib/talispros/mapsite-onboarding-phase";
import { ROUTES } from "@/lib/routes";
import MapSiteExpressInterestCard from "./MapSiteExpressInterestCard";
import MapSiteListingSidebar from "./MapSiteListingSidebar";
import MapSiteMarketPartnerCard from "./MapSiteMarketPartnerCard";
import MapSitePaymentCard from "./MapSitePaymentCard";
import MapSitePropertyPopup from "./MapSitePropertyPopup";
import MapSiteStartHereOverlay from "./MapSiteStartHereOverlay";

/** Auto-reveal PayPal registration under the sidebar after MapSite load. */
const PAYPAL_REGISTER_REVEAL_DELAY_MS = 10_000;

const PIN_COLORS: Record<string, string> = {
  UNCLAIMED: "#1A73E8",
  PENDING: "#1A73E8",
  ACTIVE: "#1A73E8",
  ARCHIVED: "#9CA3AF",
};

/** Minimum popup body height so hero + title + action row stay visible. */
const MAPSITE_POPUP_MIN_HEIGHT_PX = 304;
/** Ignore residual camera events right after programmatic pin focus. */
const FOCUS_GESTURE_GUARD_MS = 900;

interface MapSiteApplicationProps {
  initialMapSite: MapSitePlatformRecord;
  audience: RegistrationMarket;
  requestId?: string | null;
  /** Owner MapSite™ only: select primary PIN and open the property flag on load. */
  openPinOnLoad?: boolean;
  /** Owner MapSite™ only: one-time guided prompt above the open property flag. */
  showStartHere?: boolean;
  /** Claim-form plan for PayPal (e.g. ROOT_ACCOUNT_1). */
  paymentPlanType?: PlanType;
  /** Completed PayPal payment on file — unlocks Express Interest. */
  paymentReceived?: boolean;
  /** Whether a TalisBook™ exists for this MapSite / FAST Code. */
  hasTalisBook?: boolean;
  /** Viewer path for View Your TalisBook™. */
  talisBookHref?: string | null;
  /** Show PayPal immediately (Activate Your MapSite™); otherwise reveals after 10s. */
  showActivatePayment?: boolean;
  /** Entry-point choice: user setup vs done-for-you request. */
  onboardingMode?: "self" | "assisted";
  /** Original audience page where prospect entered (for context). */
  sourceAudience?: RegistrationMarket | null;
  /** Capability account type that drives permissions and UI visibility. */
  accountType?: MapSiteCapabilityAccountType;
}

export default function MapSiteApplication({
  initialMapSite,
  audience,
  requestId = null,
  openPinOnLoad = false,
  showStartHere = false,
  paymentPlanType = "ROOT_ACCOUNT",
  paymentReceived = false,
  hasTalisBook = false,
  talisBookHref = null,
  showActivatePayment = false,
  onboardingMode = "self",
  sourceAudience = null,
  accountType,
}: MapSiteApplicationProps) {
  const [mapsite] = useState(initialMapSite);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);

  const phase = pinPhaseLabel(mapsite.status);
  const pinColor = PIN_COLORS[phase] ?? PIN_COLORS.UNCLAIMED;

  const pins: MapEnginePin[] = useMemo(
    () => [
      {
        id: mapsite.id,
        latitude: mapsite.lat,
        longitude: mapsite.lng,
        color: mapsite.pin_color || pinColor,
        featured: true,
        metadata: {
          status: mapsite.status,
          phase,
          icon: mapsite.pin_icon || "home",
          whiteCenter: mapsite.pin_white_center ?? false,
        },
      },
    ],
    [mapsite, pinColor, phase]
  );

  const viewport = useMemo(
    () => ({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      zoom: mapsite.map_zoom,
    }),
    [mapsite.lat, mapsite.lng, mapsite.map_zoom]
  );

  const beginFocusGuard = useCallback(() => {
    focusingRef.current = true;
    if (focusTimerRef.current != null) {
      window.clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = window.setTimeout(() => {
      focusingRef.current = false;
      focusTimerRef.current = null;
    }, FOCUS_GESTURE_GUARD_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current != null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const dismissIfUserGesture = useCallback(() => {
    if (focusingRef.current) return;
    setSelectedPinId(null);
  }, []);

  return (
    <MapEngineProvider
      key={`${mapsite.lat.toFixed(6)}-${mapsite.lng.toFixed(6)}`}
      providerId="google-maps"
      initialPins={pins}
      initialViewport={viewport}
      selectedPinId={selectedPinId}
      draggablePinIds={[]}
      onPinSelect={(pinId) => {
        setSelectedPinId(pinId);
      }}
      onMapClick={() => dismissIfUserGesture()}
      onMapDragStart={dismissIfUserGesture}
      onMapZoom={dismissIfUserGesture}
      basemapView="satellite"
    >
      <MapSiteChrome
        mapsite={mapsite}
        audience={audience}
        accountType={accountType ?? accountTypeForAudience(audience)}
        onboardingMode={onboardingMode}
        sourceAudience={sourceAudience}
        requestId={requestId}
        openPinOnLoad={openPinOnLoad}
        showStartHere={showStartHere}
        paymentPlanType={paymentPlanType}
        paymentReceived={paymentReceived}
        hasTalisBook={hasTalisBook}
        talisBookHref={talisBookHref}
        showActivatePayment={showActivatePayment}
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
      />
    </MapEngineProvider>
  );
}

function MapSiteChrome({
  mapsite,
  audience,
  accountType,
  onboardingMode,
  sourceAudience,
  requestId,
  openPinOnLoad,
  showStartHere,
  paymentPlanType,
  paymentReceived,
  hasTalisBook,
  talisBookHref,
  showActivatePayment,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
}: {
  mapsite: MapSitePlatformRecord;
  audience: RegistrationMarket;
  accountType: MapSiteCapabilityAccountType;
  onboardingMode: "self" | "assisted";
  sourceAudience: RegistrationMarket | null;
  requestId: string | null;
  openPinOnLoad: boolean;
  showStartHere: boolean;
  paymentPlanType: PlanType;
  paymentReceived: boolean;
  hasTalisBook: boolean;
  talisBookHref: string | null;
  showActivatePayment: boolean;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
}) {
  const { setViewport, isReady } = useMapEngine();
  const rootRef = useRef<HTMLDivElement>(null);
  const sidebarStackRef = useRef<HTMLDivElement>(null);
  const listingCardRef = useRef<HTMLDivElement>(null);
  const didOpenOnLoadRef = useRef(false);
  const lastFocusedForSelectionRef = useRef<string | null>(null);

  const [compact, setCompact] = useState(false);
  const [mobileOverlay, setMobileOverlay] = useState(false);
  const [paymentDelayElapsed, setPaymentDelayElapsed] = useState(false);
  const [alignTop, setAlignTop] = useState(MAPSITE_LISTING_TILE_TOP_FALLBACK_PX);
  const [popupCenterX, setPopupCenterX] = useState<number | null>(null);
  const [expandedCardHeight, setExpandedCardHeight] = useState<number | null>(
    null
  );

  const focusPinAndOpen = useCallback(() => {
    beginFocusGuard();
    lastFocusedForSelectionRef.current = mapsite.id;
    setViewport({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      zoom: mapsite.map_zoom,
    });
    setSelectedPinId(mapsite.id);
  }, [
    beginFocusGuard,
    mapsite.id,
    mapsite.lat,
    mapsite.lng,
    mapsite.map_zoom,
    setSelectedPinId,
    setViewport,
  ]);

  useEffect(() => {
    if (selectedPinId !== mapsite.id) {
      lastFocusedForSelectionRef.current = null;
      return;
    }
    if (lastFocusedForSelectionRef.current === mapsite.id) return;

    beginFocusGuard();
    setViewport({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      zoom: mapsite.map_zoom,
    });
    lastFocusedForSelectionRef.current = mapsite.id;
  }, [
    selectedPinId,
    mapsite.id,
    mapsite.lat,
    mapsite.lng,
    mapsite.map_zoom,
    beginFocusGuard,
    setViewport,
  ]);

  useEffect(() => {
    if (!openPinOnLoad || !isReady || didOpenOnLoadRef.current) return;
    didOpenOnLoadRef.current = true;
    focusPinAndOpen();
  }, [openPinOnLoad, isReady, focusPinAndOpen]);

  useEffect(() => {
    const root = rootRef.current;
    const card = listingCardRef.current;
    const stack = sidebarStackRef.current;
    if (!root || !card) return;

    const syncLayout = () => {
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const stackRect = stack?.getBoundingClientRect();
      const popupOpen = selectedPinId === mapsite.id;
      const isMobileOverlay = rootRect.width < 640;

      const layout = computeMapSiteOverlayLayout({
        rootWidth: rootRect.width,
        rootHeight: rootRect.height,
        listingTop: Math.max(0, Math.round(cardRect.top - rootRect.top)),
        listingRight: Math.round(cardRect.right - rootRect.left),
        overlayBottom: Math.round(
          (stackRect?.bottom ?? cardRect.bottom) - rootRect.top
        ),
        popupOpen,
      });

      setCompact(layout.compact);
      setMobileOverlay(isMobileOverlay);

      // Phone-only composition: search at top, manager strip at bottom,
      // and the property card above the centered map pin.
      if (popupOpen && isMobileOverlay) {
        // Anchored under the search bar, but never tall enough to reach the pin.
        const tipPointY = Math.round(
          rootRect.height / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX
        );
        const top = MAPSITE_LISTING_TILE_TOP_FALLBACK_PX;
        const height = Math.max(
          MAPSITE_MIN_CARD_HEIGHT_PX,
          Math.min(
            MAPSITE_POPUP_MIN_HEIGHT_PX,
            tipPointY - MAPSITE_POPUP_TIP_HEIGHT_PX - top
          )
        );
        setAlignTop((prev) => (prev === top ? prev : top));
        setExpandedCardHeight((prev) => (prev === height ? prev : height));
        setPopupCenterX((prev) => {
          const next = Math.round(rootRect.width / 2);
          return prev === next ? prev : next;
        });
        return;
      }

      if (popupOpen) {
        const tipPointY = Math.round(
          rootRect.height / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX
        );
        const cardBottom = tipPointY - MAPSITE_POPUP_TIP_HEIGHT_PX;
        const height = MAPSITE_POPUP_MIN_HEIGHT_PX;
        const top = Math.max(8, cardBottom - height);
        setAlignTop((prev) => (prev === top ? prev : top));
        setExpandedCardHeight((prev) => (prev === height ? prev : height));
        setPopupCenterX((prev) => {
          const next = Math.round(rootRect.width / 2);
          return prev === next ? prev : next;
        });
        return;
      }

      setAlignTop((prev) =>
        prev === layout.alignTop ? prev : layout.alignTop
      );
      setExpandedCardHeight((prev) => {
        const next = Math.max(MAPSITE_MIN_CARD_HEIGHT_PX, layout.cardHeight);
        return prev === next ? prev : next;
      });
      setPopupCenterX((prev) =>
        prev === layout.popupCenterX ? prev : layout.popupCenterX
      );
    };

    syncLayout();
    const observer = new ResizeObserver(syncLayout);
    observer.observe(root);
    observer.observe(card);
    if (stack) observer.observe(stack);
    window.addEventListener("resize", syncLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
    };
  }, [
    mapsite.status,
    mapsite.fast_code,
    mapsite.property_title,
    mapsite.id,
    selectedPinId,
  ]);

  const claimed = !isClaimable(mapsite.status);
  // PayPal stays until a completed payment note exists (not merely ACTIVE status).
  const paid = paymentReceived;
  const onboardingPhase = getMapSiteOnboardingPhase({
    status: mapsite.status,
    paymentReceived: paid,
    hasTalisBook: hasTalisBook || Boolean(talisBookHref || mapsite.teb_url),
  });

  // Unpaid claimed MapSites: reveal PayPal after load delay (or immediately via Activate).
  useEffect(() => {
    if (!claimed || paid || showActivatePayment) return;
    const timer = window.setTimeout(() => {
      setPaymentDelayElapsed(true);
    }, PAYPAL_REGISTER_REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [claimed, paid, showActivatePayment, mapsite.id]);

  const showDelayedPayment = showActivatePayment || paymentDelayElapsed;

  const bookHref =
    talisBookHref ||
    (typeof mapsite.teb_url === "string" && mapsite.teb_url.trim()
      ? mapsite.teb_url.trim()
      : hasTalisBook && mapsite.fast_code
        ? `${ROUTES.TALISBOOKS_LIBRARY}?fastCode=${encodeURIComponent(
            mapsite.fast_code.trim()
          )}`
        : null);

  const claimHref = useMemo(() => {
    const targetAudience = sourceAudience || audience;
    if (onboardingMode === "assisted") {
      const params = new URLSearchParams({
        audience: targetAudience,
        accountType: accountTypeForAudience(targetAudience),
      });
      if (sourceAudience) {
        params.set("sourceAudience", sourceAudience);
      }
      return `/talispros/build-mapsite?${params.toString()}`;
    }
    const params = new URLSearchParams({
      mapsiteId: mapsite.id,
      audience: targetAudience,
      accountType: accountTypeForAudience(targetAudience),
      returnTo: MAPSITE_APP_PATH,
    });
    return `/talispros/markets/claim-a-market?${params.toString()}`;
  }, [mapsite.id, audience, onboardingMode, sourceAudience]);
  const claimLabel =
    onboardingMode === "assisted"
      ? "Register Account now"
      : "Register Account now";

  // Express Interest only after payment. PayPal uses claim-form planType;
  // auto-reveals under the sidebar 10s after load (or immediately via Activate).
  const registrationCard =
    claimed && paid && mapsite.fast_code ? (
      <MapSiteExpressInterestCard
        fastCode={mapsite.fast_code}
        propertyTitle={mapsite.property_title}
      />
    ) : claimed && !paid && showDelayedPayment ? (
      <MapSitePaymentCard
        audience={audience}
        mapsiteId={mapsite.id}
        fastCode={mapsite.fast_code}
        requestId={requestId}
        planType={paymentPlanType}
        compact={mobileOverlay}
      />
    ) : null;

  return (
    <div
      ref={rootRef}
      className="relative h-dvh w-screen overflow-hidden bg-neutral-900"
    >
      <MapEngineCanvas className="h-full w-full" />

      <div
        ref={sidebarStackRef}
        className={
          mobileOverlay
            ? "pointer-events-none absolute inset-0 z-20 p-3"
            : compact
              ? "pointer-events-none absolute inset-x-0 top-0 z-20 h-[min(52%,30rem)] p-3 sm:h-[min(48%,28rem)]"
            : "pointer-events-none absolute inset-0 z-20"
        }
      >
        <MapSiteListingSidebar
          mapsite={mapsite}
          listingCardRef={listingCardRef}
          compact={compact}
          mobileOverlay={mobileOverlay}
          onSelectListing={focusPinAndOpen}
          aboveCard={
            claimed ? (
              <MapSiteMarketPartnerCard
                audience={audience}
                mapsite={mapsite}
                cardRef={listingCardRef}
                onSelect={focusPinAndOpen}
              />
            ) : null
          }
          belowCard={registrationCard}
        />
      </div>

      {selectedPinId === mapsite.id ? (
        <>
          <MapSitePropertyPopup
            mapsite={mapsite}
            claimHref={claimHref}
            claimLabel={claimLabel}
            genericOnboardingCard={!paid}
            accountType={accountType}
            onboardingPhase={onboardingPhase}
            talisBookHref={bookHref}
            alignTop={alignTop}
            centerX={popupCenterX}
            cardHeight={expandedCardHeight}
            compact={compact}
            onClose={() => setSelectedPinId(null)}
          />
          <MapSiteStartHereOverlay
            mapsiteId={mapsite.id}
            fastCode={mapsite.fast_code}
            accountType={audience}
            requestId={requestId}
            tipTop={alignTop}
            centerX={popupCenterX}
            enabled={showStartHere && onboardingPhase === "ACTIVE"}
          />
        </>
      ) : null}
    </div>
  );
}
