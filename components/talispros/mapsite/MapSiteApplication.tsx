"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import {
  MAPSITE_PIN_DEFAULT_BORDER,
  MAPSITE_PIN_DEFAULT_ICON,
  resolveMapSitePinStyle,
} from "@/lib/mapsite-pin-style";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { PlanType } from "@/lib/registration-plans";
import {
  MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX,
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
import { mapsitePublicPinLabel } from "@/lib/mapsite-pin-label";
import type { MapsiteFlagIdentity } from "@/lib/talispros/flag-identity";
import {
  isClaimable,
  MAPSITE_APP_PATH,
  pinPhaseLabel,
} from "@/lib/talispros/mapsite-state";
import {
  getMapSiteOnboardingPhase,
} from "@/lib/talispros/mapsite-onboarding-phase";
import { ROUTES } from "@/lib/routes";
import { isDemonstrationListing } from "@/lib/talispros/demo-mapsite";
import MapSiteListingSidebar from "./MapSiteListingSidebar";
import MapSiteMarketPartnerCard, {
  DEFAULT_MAPSITE_PARTNER_TAGLINE,
  defaultMapSitePartnerImage,
  defaultMapSitePartnerName,
} from "./MapSiteMarketPartnerCard";
import { resolveMapSiteBranding, withOwnerLogo } from "@/lib/talispros/mapsite-branding";
import MapSiteLogoImageEditor from "./MapSiteLogoImageEditor";
import MapSiteBookshelfEditor from "./MapSiteBookshelfEditor";
import MapSiteEbookEditorPanel from "./MapSiteEbookEditorPanel";
import DemoClaimMarketButton from "./DemoClaimMarketButton";
import MapSitePaymentCard from "./MapSitePaymentCard";
import MapSitePropertyPopup from "./MapSitePropertyPopup";
import MapSiteStartHereOverlay from "./MapSiteStartHereOverlay";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import { TALISU_REGISTER } from "@/lib/talisu/content";
import { getMapSiteActivationPaymentStatus } from "@/app/talispros/mapsite/actions";
import {
  confirmAdditionalPinCheckout,
  fixMapSiteAdditionalPin,
  placeMapSiteAdditionalPin,
} from "@/app/talispros/mapsite/pin-actions";
import {
  defaultMapSitePinDashboard,
  normalizePinCoordinate,
  type MapSitePinDashboardState,
} from "@/lib/talispros/mapsite-additional-pins";
import {
  postMapSitePaymentRedirectHref,
  shouldRegisterAgentsAfterPayment,
} from "@/lib/talispros/register-agents";
import MapSitePinDashboard, {
  type PinEditorState,
} from "@/components/talispros/mapsite/MapSitePinDashboard";
import {
  MAPSITE_DASHBOARD_MENU_ITEMS,
  emptyMapSiteOwnerCustomizations,
  type MapSiteDashboardPanelId,
  type MapSiteOwnerCustomizations,
} from "@/lib/talispros/mapsite-owner-customizations";
import { mapsiteAgencyLogoUrl } from "@/lib/talispros/mapsite-listing-media";

/** Owner Dashboard dropdown: Ebook Editor, Logo & Card Editor, PIN Dashboard, Bookshelf Editor. */
const DASHBOARD_MENU = MAPSITE_DASHBOARD_MENU_ITEMS;

/** Minimum popup body height so hero + title + action row stay visible. */
const MAPSITE_POPUP_MIN_HEIGHT_PX = 384;
/** Ignore residual camera events right after programmatic pin focus. */
const FOCUS_GESTURE_GUARD_MS = 900;

interface MapSiteApplicationProps {
  initialMapSite: MapSitePlatformRecord;
  audience: RegistrationMarket;
  requestId?: string | null;
  /** Owner Mapsite only: select primary PIN and open the property flag on load. */
  openPinOnLoad?: boolean;
  /** Owner Mapsite only: one-time guided prompt above the open property flag. */
  showStartHere?: boolean;
  /** Claim-form plan for activation checkout display (full Root Account™). */
  paymentPlanType?: PlanType;
  /** Completed activation payment on file — unlocks listing resources. */
  paymentReceived?: boolean;
  /** Whether a Talisbook™ exists for this Mapsite / FAST Code. */
  hasTalisBook?: boolean;
  /** Viewer path for View Your Talisbook™. */
  talisBookHref?: string | null;
  /** Show activation checkout only for an explicit Activate link or a checkout return. */
  showActivatePayment?: boolean;
  /** Stripe Checkout return. Never treated as proof of payment. */
  checkoutStatus?: "success" | "cancelled" | null;
  /** Checkout session id from success_url — used to activate if the webhook lagged. */
  checkoutSessionId?: string | null;
  /** Entry-point choice: user setup vs done-for-you request. */
  onboardingMode?: "self" | "assisted";
  /** Original audience page where prospect entered (for context). */
  sourceAudience?: RegistrationMarket | null;
  /** Capability account type that drives permissions and UI visibility. */
  accountType?: MapSiteCapabilityAccountType;
  /** True when this browser has the owner / paid Mapsite session. */
  isOwner?: boolean;
  /** Claimed URL account-type segment (brokers, listings, …) for Logout return. */
  accountTypeSegment?: string | null;
  /** Choose for Flag preference from the Talisbook™ (default Address). */
  flagIdentity?: MapsiteFlagIdentity | null;
  /** Agent/owner name used when Choose for Flag is Name. */
  flagName?: string | null;
  /** Included PIN plus purchased capacity and placed additional PINs. */
  initialPinDashboard?: MapSitePinDashboardState;
  /** Return from additional-PIN Stripe Checkout. Separate from activation checkout. */
  pinCheckoutStatus?: "success" | "cancelled" | null;
  pinCheckoutSessionId?: string | null;
  /**
   * Owner session or Mapsite admin may use the Dashboard dropdown. Server
   * actions still re-check requireMapSiteEditAccess (owner + paid, or admin).
   */
  canManageDashboard?: boolean;
  /** Logo / left-card image overrides and saved bookshelf order. */
  initialOwnerCustomizations?: MapSiteOwnerCustomizations | null;
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
  checkoutStatus = null,
  checkoutSessionId = null,
  onboardingMode = "self",
  sourceAudience = null,
  accountType,
  isOwner = false,
  accountTypeSegment = null,
  flagIdentity = null,
  flagName = null,
  initialPinDashboard,
  pinCheckoutStatus = null,
  pinCheckoutSessionId = null,
  canManageDashboard,
  initialOwnerCustomizations = null,
}: MapSiteApplicationProps) {
  const [mapsite] = useState(initialMapSite);
  const [pinDashboard, setPinDashboard] = useState(
    () => initialPinDashboard ?? defaultMapSitePinDashboard(),
  );
  const [pinEditor, setPinEditor] = useState<PinEditorState>({ kind: "idle" });
  const placeLockRef = useRef(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [lockCenterOffset, setLockCenterOffset] = useState({ x: 0, y: 0 });
  const setLockCenterOffsetSafe = useCallback(
    (next: { x: number; y: number }) => {
      setLockCenterOffset((prev) =>
        prev.x === next.x && prev.y === next.y ? prev : next,
      );
    },
    [],
  );
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);
  const showClaimedNav = !isClaimable(mapsite.status);

  const pinLabel = mapsitePublicPinLabel({
    propertyTitle: mapsite.property_title,
    address: mapsite.property_address,
    fallback: mapsite.fast_code?.trim().toUpperCase() || "Location",
    agentName: flagName,
    flagIdentity,
    accountType,
  });
  const phase = pinPhaseLabel(mapsite.status);
  const pins: MapEnginePin[] = useMemo(() => {
    const savedPin = resolveMapSitePinStyle({
      pinIcon: mapsite.pin_icon,
      pinColor: mapsite.pin_color,
      pinBorder: mapsite.pin_border,
      pinWhiteCenter: mapsite.pin_white_center,
      pinAnimated: mapsite.pin_animated,
      pinCategoryBadge: mapsite.pin_category_badge,
    });
    const styleMetadata = {
      status: mapsite.status,
      phase,
      icon: savedPin.pinIcon || MAPSITE_PIN_DEFAULT_ICON,
      border: savedPin.pinBorder || MAPSITE_PIN_DEFAULT_BORDER,
      whiteCenter: savedPin.whiteCenter,
      animated: savedPin.pinAnimated,
      categoryBadge: savedPin.pinCategoryBadge,
    };
    return [
      {
        id: mapsite.id,
        latitude: mapsite.lat,
        longitude: mapsite.lng,
        color: savedPin.pinColor,
        label: pinLabel,
        featured: true,
        metadata: styleMetadata,
      },
      ...pinDashboard.pins.map((pin, index) => ({
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        color: savedPin.pinColor,
        label: pin.label.trim() || `PIN ${index + 2}`,
        featured: false,
        metadata: { ...styleMetadata, additional: true },
      })),
    ];
  }, [mapsite, phase, pinLabel, pinDashboard.pins]);

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

  const pinEditorActive = pinEditor.kind !== "idle";
  const lockMapCenter = pinDashboard.pins.length === 0 && !pinEditorActive;

  useEffect(() => {
    if (pinCheckoutStatus !== "success" || !pinCheckoutSessionId) return;
    let cancelled = false;
    void confirmAdditionalPinCheckout(pinCheckoutSessionId).then((result) => {
      if (cancelled || !("dashboard" in result) || !result.dashboard) return;
      setPinDashboard(result.dashboard);
    });
    return () => {
      cancelled = true;
    };
  }, [pinCheckoutStatus, pinCheckoutSessionId]);

  const placeAdditionalAt = useCallback(
    async (latitude: number, longitude: number) => {
      const code = mapsite.fast_code?.trim();
      if (!code || placeLockRef.current || pinEditor.kind !== "place") return;
      placeLockRef.current = true;
      try {
        const result = await placeMapSiteAdditionalPin({
          mapsiteId: mapsite.id,
          fastCode: code,
          latitude,
          longitude,
        });
        if ("dashboard" in result && result.dashboard) {
          setPinDashboard(result.dashboard);
          if (result.dashboard.remainingToPlace <= 0) {
            setPinEditor({ kind: "idle" });
          }
        }
      } finally {
        placeLockRef.current = false;
      }
    },
    [mapsite.fast_code, mapsite.id, pinEditor.kind],
  );

  const fixAdditionalAt = useCallback(
    async (pinId: string, latitude: number, longitude: number) => {
      const code = mapsite.fast_code?.trim();
      // While the PIN Dashboard is open (place mode) every extra PIN can be dragged.
      const canDrag =
        pinEditor.kind === "place" ||
        (pinEditor.kind === "fix" && pinEditor.pinId === pinId);
      if (!code || !canDrag) return;
      setPinDashboard((current) => ({
        ...current,
        pins: current.pins.map((pin) =>
          pin.id === pinId ? { ...pin, latitude, longitude } : pin,
        ),
      }));
      const result = await fixMapSiteAdditionalPin({
        mapsiteId: mapsite.id,
        fastCode: code,
        pinId,
        latitude,
        longitude,
      });
      if ("dashboard" in result && result.dashboard) {
        setPinDashboard(result.dashboard);
      }
    },
    [mapsite.fast_code, mapsite.id, pinEditor],
  );

  return (
    <MapEngineProvider
      key={`${mapsite.lat.toFixed(6)}-${mapsite.lng.toFixed(6)}`}
      providerId="google-maps"
      initialPins={pins}
      initialViewport={viewport}
      selectedPinId={selectedPinId}
      draggablePinIds={
        pinEditor.kind === "fix"
          ? [pinEditor.pinId]
          : pinEditor.kind === "place"
            ? pinDashboard.pins.map((pin) => pin.id)
            : []
      }
      lockCenter={lockMapCenter}
      lockCenterOffset={lockCenterOffset}
      preserveViewport
      onPinSelect={(pinId) => {
        setSelectedPinId(pinId);
      }}
      onMapClick={(coordinates) => {
        if (pinEditor.kind === "place" && pinDashboard.remainingToPlace > 0) {
          const latitude = normalizePinCoordinate(coordinates.latitude, "lat");
          const longitude = normalizePinCoordinate(coordinates.longitude, "lng");
          if (latitude == null || longitude == null) return;
          void placeAdditionalAt(latitude, longitude);
          return;
        }
        dismissIfUserGesture();
      }}
      onPinDrag={(pinId, coordinates) => {
        const latitude = normalizePinCoordinate(coordinates.latitude, "lat");
        const longitude = normalizePinCoordinate(coordinates.longitude, "lng");
        if (latitude == null || longitude == null) return;
        void fixAdditionalAt(pinId, latitude, longitude);
      }}
      onMapDragStart={dismissIfUserGesture}
      onMapZoom={dismissIfUserGesture}
      basemapView="satellite"
      scrollZoom={false}
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
        checkoutStatus={checkoutStatus}
        checkoutSessionId={checkoutSessionId}
        isOwner={isOwner}
        accountTypeSegment={accountTypeSegment}
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
        showClaimedNav={showClaimedNav}
        onLockCenterOffsetChange={setLockCenterOffsetSafe}
        pinDashboard={pinDashboard}
        pinEditor={pinEditor}
        pinCheckoutStatus={pinCheckoutStatus}
        onPinDashboardChange={setPinDashboard}
        onPinEditorChange={setPinEditor}
        canManageDashboard={canManageDashboard ?? isOwner}
        initialOwnerCustomizations={initialOwnerCustomizations}
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
  checkoutStatus,
  checkoutSessionId,
  isOwner,
  accountTypeSegment,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
  showClaimedNav,
  onLockCenterOffsetChange,
  pinDashboard,
  pinEditor,
  pinCheckoutStatus,
  onPinDashboardChange,
  onPinEditorChange,
  canManageDashboard,
  initialOwnerCustomizations,
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
  checkoutStatus: "success" | "cancelled" | null;
  checkoutSessionId: string | null;
  isOwner: boolean;
  accountTypeSegment: string | null;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
  showClaimedNav: boolean;
  onLockCenterOffsetChange: (offset: { x: number; y: number }) => void;
  pinDashboard: MapSitePinDashboardState;
  pinEditor: PinEditorState;
  pinCheckoutStatus: "success" | "cancelled" | null;
  onPinDashboardChange: (dashboard: MapSitePinDashboardState) => void;
  onPinEditorChange: (editor: PinEditorState) => void;
  canManageDashboard: boolean;
  initialOwnerCustomizations: MapSiteOwnerCustomizations | null;
}) {
  const { setViewport, isReady, fitToCoordinates } = useMapEngine();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const sidebarStackRef = useRef<HTMLDivElement>(null);
  const listingCardRef = useRef<HTMLDivElement>(null);
  const didOpenOnLoadRef = useRef(false);
  const lastFocusedForSelectionRef = useRef<string | null>(null);

  const [compact, setCompact] = useState(false);
  const [mobileOverlay, setMobileOverlay] = useState(false);
  const [activationPaid, setActivationPaid] = useState(paymentReceived);
  const [alignTop, setAlignTop] = useState(MAPSITE_LISTING_TILE_TOP_FALLBACK_PX);
  const [popupCenterX, setPopupCenterX] = useState<number | null>(null);
  const [expandedCardHeight, setExpandedCardHeight] = useState<number | null>(
    null
  );
  const [dashboardPanel, setDashboardPanel] =
    useState<MapSiteDashboardPanelId | null>(null);
  const dashboardOpen = dashboardPanel !== null;
  const [ownerCustomizations, setOwnerCustomizations] =
    useState<MapSiteOwnerCustomizations>(
      () => initialOwnerCustomizations ?? emptyMapSiteOwnerCustomizations(),
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
      const navNudge = showClaimedNav ? MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX : 0;

      if (popupOpen && isMobileOverlay) {
        // Anchored under the search bar, but never tall enough to reach the pin.
        // Nudge pin/card down when the blue TalisU™ navbar is present.
        const tipPointY = Math.round(
          rootRect.height / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX + navNudge
        );
        const top = Math.max(
          MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
          8 + navNudge,
        );
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
        onLockCenterOffsetChange({ x: 0, y: navNudge });
        return;
      }

      if (popupOpen) {
        const tipPointY = Math.round(
          rootRect.height / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX + navNudge
        );
        const cardBottom = tipPointY - MAPSITE_POPUP_TIP_HEIGHT_PX;
        const top = Math.max(8 + navNudge, cardBottom - MAPSITE_POPUP_MIN_HEIGHT_PX);
        setAlignTop((prev) => (prev === top ? prev : top));
        setExpandedCardHeight((prev) => (prev === null ? prev : null));
        setPopupCenterX((prev) => {
          const next = Math.round(rootRect.width / 2);
          return prev === next ? prev : next;
        });
        onLockCenterOffsetChange({ x: 0, y: navNudge });
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
      onLockCenterOffsetChange({
        x: layout.pinOffset.x,
        y: layout.pinOffset.y + navNudge,
      });
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
    showClaimedNav,
    onLockCenterOffsetChange,
  ]);

  const claimed = !isClaimable(mapsite.status);
  const isDemoListing = isDemonstrationListing({
    isDemonstration: mapsite.is_demonstration,
    fastCode: mapsite.fast_code,
  });
  // Checkout stays until a completed payment note exists (not merely ACTIVE status).
  const paid = isDemoListing || activationPaid;
  // Header Dashboard unlocks only on real activation payment — never demo-only.
  const dashboardUnlocked = activationPaid && !isDemoListing;
  const onboardingPhase = getMapSiteOnboardingPhase({
    status: mapsite.status,
    paymentReceived: paid,
    hasTalisBook: hasTalisBook || Boolean(talisBookHref || mapsite.teb_url),
  });

  useEffect(() => {
    setActivationPaid(paymentReceived);
  }, [paymentReceived]);

  useEffect(() => {
    if (paid || checkoutStatus !== "success") return;
    let cancelledPoll = false;
    const sessionId =
      checkoutSessionId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("session_id")
        : null);
    const poll = async () => {
      const { paid: nextPaid } = await getMapSiteActivationPaymentStatus({
        mapsiteId: mapsite.id,
        fastCode: mapsite.fast_code,
        requestId,
        stripeCheckoutSessionId: sessionId,
      });
      if (cancelledPoll || !nextPaid) return;
      setActivationPaid(true);
      router.refresh();
      if (
        shouldRegisterAgentsAfterPayment({
          audience,
          accountType,
        })
      ) {
        router.replace(
          postMapSitePaymentRedirectHref({
            audience,
            accountType,
            fastCode: mapsite.fast_code,
            mapsiteId: mapsite.id,
            requestId,
          }),
        );
      }
    };
    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 2500);
    return () => {
      cancelledPoll = true;
      window.clearInterval(timer);
    };
  }, [
    paid,
    checkoutStatus,
    mapsite.id,
    mapsite.fast_code,
    requestId,
    checkoutSessionId,
    audience,
    accountType,
    router,
  ]);

  const showExplicitPayment =
    showActivatePayment || Boolean(checkoutStatus);

  // Every paid (non-demo) Mapsite owner — or a Mapsite admin — gets the menu.
  const dashboardManageable = dashboardUnlocked && canManageDashboard;

  const openOwnerDashboard = useCallback(() => {
    focusPinAndOpen();
    if (dashboardManageable) {
      setDashboardPanel("pins");
    }
  }, [dashboardManageable, focusPinAndOpen]);

  const selectDashboardItem = useCallback(
    (id: string) => {
      if (!dashboardManageable) return;
      const item = MAPSITE_DASHBOARD_MENU_ITEMS.find((entry) => entry.id === id);
      if (!item) return;
      if (item.id === "pins") focusPinAndOpen();
      onPinEditorChange({ kind: "idle" });
      setDashboardPanel(item.id);
    },
    [dashboardManageable, focusPinAndOpen, onPinEditorChange],
  );

  const closeDashboardPanel = useCallback(() => {
    setDashboardPanel(null);
    onPinEditorChange({ kind: "idle" });
  }, [onPinEditorChange]);

  useEffect(() => {
    if (!pinCheckoutStatus || !dashboardManageable) return;
    setDashboardPanel("pins");
  }, [pinCheckoutStatus, dashboardManageable]);

  const defaultPartnerImage = defaultMapSitePartnerImage(audience);
  const defaultPartnerName = defaultMapSitePartnerName(mapsite);
  // One resolver for logo + partner photo/name/tagline (owner overrides win).
  const branding = useMemo(
    () =>
      resolveMapSiteBranding(
        {
          logoUrl: mapsite.logo_url,
          partnerImageUrl: defaultPartnerImage,
          partnerName: defaultPartnerName,
          partnerTagline: DEFAULT_MAPSITE_PARTNER_TAGLINE,
        },
        ownerCustomizations,
      ),
    [mapsite.logo_url, defaultPartnerImage, defaultPartnerName, ownerCustomizations],
  );
  // Branded record (owner logo override) for the left card, sidebar and popup.
  const cardMapSite = useMemo(
    () => withOwnerLogo(mapsite, ownerCustomizations),
    [mapsite, ownerCustomizations],
  );

  const pinFitKey = pinDashboard.pins
    .map((pin) => `${pin.id}:${pin.latitude}:${pin.longitude}`)
    .join("|");

  useEffect(() => {
    if (!isReady || pinDashboard.pins.length === 0 || pinEditor.kind !== "idle") {
      return;
    }
    fitToCoordinates(
      [
        { latitude: mapsite.lat, longitude: mapsite.lng },
        ...pinDashboard.pins.map((pin) => ({
          latitude: pin.latitude,
          longitude: pin.longitude,
        })),
      ],
      { top: 72, right: 48, bottom: 96, left: 48 },
    );
  }, [
    fitToCoordinates,
    isReady,
    mapsite.lat,
    mapsite.lng,
    pinDashboard.pins,
    pinEditor.kind,
    pinFitKey,
  ]);

  const bookHref =
    talisBookHref ||
    (typeof mapsite.teb_url === "string" && mapsite.teb_url.trim()
      ? mapsite.teb_url.trim()
      : hasTalisBook && mapsite.fast_code
        ? `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(
            mapsite.fast_code.trim().toLowerCase()
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
  // Paid Mapsites: agency logo on the solid partner card. Checkout stays
  // off the first-look map unless the visitor opens Activate or returns from checkout.
  const registrationCard =
    !isDemoListing && claimed && !paid && showExplicitPayment ? (
      <MapSitePaymentCard
        audience={audience}
        mapsiteId={mapsite.id}
        fastCode={mapsite.fast_code}
        requestId={requestId}
        planType={paymentPlanType}
        propertyAddress={mapsite.property_address}
        compact={mobileOverlay}
        checkoutStatus={checkoutStatus}
      />
    ) : null;

  return (
    <div className="relative flex h-dvh max-h-dvh w-screen flex-col overflow-hidden overscroll-none bg-neutral-900">
      {claimed ? (
        <TalisUMktsHeader
          variant="claimed-mapsite"
          dashboardUnlocked={dashboardUnlocked}
          registerHref={TALISU_REGISTER.samcartUrl}
          onOpenDashboard={openOwnerDashboard}
          dashboardMenuItems={dashboardManageable ? DASHBOARD_MENU : undefined}
          onSelectDashboardItem={selectDashboardItem}
        />
      ) : null}
      <div
        ref={rootRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-neutral-900"
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
            mapsite={cardMapSite}
            listingCardRef={listingCardRef}
            compact={compact}
            mobileOverlay={mobileOverlay}
            onSelectListing={focusPinAndOpen}
            aboveCard={
              claimed ? (
                <MapSiteMarketPartnerCard
                  audience={audience}
                  mapsite={cardMapSite}
                  partnerImageUrl={branding.partnerImageUrl}
                  partnerName={branding.partnerName}
                  partnerTagline={branding.partnerTagline}
                  cardRef={listingCardRef}
                  onSelect={focusPinAndOpen}
                  paid={paid}
                  isOwner={isOwner}
                  accountTypeSegment={accountTypeSegment}
                  showKnowledgeBaseManage={dashboardUnlocked}
                />
              ) : null
            }
            belowCard={registrationCard}
          />
        </div>

        {isDemoListing ? (
          <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col items-end justify-end sm:bottom-4 sm:right-4">
            <div className="pointer-events-auto max-h-[min(70vh,36rem)] overflow-y-auto">
              <DemoClaimMarketButton
                mapsiteId={mapsite.id}
                suggestedFullName={mapsite.agent_name}
                align="end"
              />
            </div>
          </div>
        ) : null}

        {dashboardPanel === "pins" && dashboardManageable ? (
          <MapSitePinDashboard
            open
            mapsiteId={mapsite.id}
            fastCode={mapsite.fast_code || ""}
            accountTypeSegment={accountTypeSegment}
            dashboard={pinDashboard}
            editor={pinEditor}
            checkoutStatus={pinCheckoutStatus}
            onClose={closeDashboardPanel}
            onDashboardChange={onPinDashboardChange}
            onEditorChange={onPinEditorChange}
          />
        ) : null}

        {dashboardPanel === "branding" && dashboardManageable ? (
          <MapSiteLogoImageEditor
            mapsiteId={mapsite.id}
            fastCode={mapsite.fast_code || ""}
            currentLogoUrl={mapsiteAgencyLogoUrl(branding.logoUrl)}
            currentPartnerImageUrl={branding.partnerImageUrl}
            defaultLogoUrl={mapsiteAgencyLogoUrl(mapsite.logo_url)}
            defaultPartnerImageUrl={defaultPartnerImage}
            defaultPartnerName={defaultPartnerName}
            defaultPartnerTagline={DEFAULT_MAPSITE_PARTNER_TAGLINE}
            customizations={ownerCustomizations}
            onClose={closeDashboardPanel}
            onSaved={setOwnerCustomizations}
          />
        ) : null}

        {dashboardPanel === "ebooks" && dashboardManageable ? (
          <MapSiteEbookEditorPanel
            mapsiteId={mapsite.id}
            fastCode={mapsite.fast_code || ""}
            onClose={closeDashboardPanel}
          />
        ) : null}

        {dashboardPanel === "bookshelf" && dashboardManageable ? (
          <MapSiteBookshelfEditor
            mapsiteId={mapsite.id}
            fastCode={mapsite.fast_code || ""}
            onClose={closeDashboardPanel}
          />
        ) : null}

        {selectedPinId === mapsite.id && !dashboardOpen ? (
          <>
            <MapSitePropertyPopup
              mapsite={cardMapSite}
              claimHref={claimHref}
              claimLabel={claimLabel}
              genericOnboardingCard={!claimed}
              accountType={accountType}
              onboardingPhase={onboardingPhase}
              talisBookHref={bookHref}
              canBuyAdditionalPins={dashboardManageable}
              onOpenAdditionalPins={openOwnerDashboard}
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
    </div>
  );
}
