const PIN_STYLE_MARKER = "__PIN_STYLE__";
const PIN_PLACEMENT_MARKER = "__PIN_PLACEMENT__";
const LISTING_LINKS_MARKER = "__LISTING_LINKS__";

export interface PinStyleExtras {
  whiteCenter: boolean;
  animated: boolean;
  categoryBadge: string | null;
}

export interface PinPlacementExtras {
  manualPlacement: boolean;
  reverseGeocodedAddress: string | null;
}

export interface ListingLinkExtras {
  mlsUrl: string | null;
  brokerUrl: string | null;
}

export function normalizeListingHref(
  value: string | null | undefined,
): string | null {
  const href = value?.trim() || "";
  if (!href) return null;
  if (/^https?:\/\//i.test(href) || href.startsWith("/")) return href;
  return `https://${href}`;
}

function nextMarkerIndex(notes: string, start: number): number {
  const candidates = [
    notes.indexOf(PIN_STYLE_MARKER, start),
    notes.indexOf(PIN_PLACEMENT_MARKER, start),
    notes.indexOf(LISTING_LINKS_MARKER, start),
  ].filter((i) => i >= 0);
  return candidates.length > 0 ? Math.min(...candidates) : notes.length;
}

export function encodePinStyleInNotes(
  additionalComments: string,
  extras: PinStyleExtras,
  placement?: PinPlacementExtras,
  listing?: ListingLinkExtras,
): string | null {
  const parts: string[] = [];
  const comments = additionalComments.trim();
  if (comments) parts.push(comments);

  if (extras.whiteCenter || extras.animated || extras.categoryBadge) {
    parts.push(`${PIN_STYLE_MARKER}${JSON.stringify(extras)}`);
  }

  if (
    placement &&
    (placement.manualPlacement || placement.reverseGeocodedAddress)
  ) {
    parts.push(
      `${PIN_PLACEMENT_MARKER}${JSON.stringify({
        manualPlacement: Boolean(placement.manualPlacement),
        reverseGeocodedAddress: placement.reverseGeocodedAddress?.trim() || null,
      } satisfies PinPlacementExtras)}`
    );
  }

  const mlsUrl = normalizeListingHref(listing?.mlsUrl);
  const brokerUrl = normalizeListingHref(listing?.brokerUrl);
  if (mlsUrl || brokerUrl) {
    parts.push(
      `${LISTING_LINKS_MARKER}${JSON.stringify({
        mlsUrl,
        brokerUrl,
      } satisfies ListingLinkExtras)}`,
    );
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

function parseJsonAfterMarker<T>(notes: string, marker: string): T | null {
  const markerIndex = notes.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = markerIndex + marker.length;
  const end = nextMarkerIndex(notes, start);

  try {
    return JSON.parse(notes.slice(start, end).trim()) as T;
  } catch {
    return null;
  }
}

export function decodePinStyleFromNotes(notes: string | null | undefined): {
  additionalComments: string;
  extras: PinStyleExtras;
  placement: PinPlacementExtras;
} {
  const emptyPlacement: PinPlacementExtras = {
    manualPlacement: false,
    reverseGeocodedAddress: null,
  };

  if (!notes?.trim()) {
    return {
      additionalComments: "",
      extras: { whiteCenter: false, animated: false, categoryBadge: null },
      placement: emptyPlacement,
    };
  }

  const styleMarkerIndex = notes.indexOf(PIN_STYLE_MARKER);
  const placementMarkerIndex = notes.indexOf(PIN_PLACEMENT_MARKER);
  const listingMarkerIndex = notes.indexOf(LISTING_LINKS_MARKER);
  const firstMarkerIndex = [styleMarkerIndex, placementMarkerIndex, listingMarkerIndex]
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];

  const additionalComments =
    firstMarkerIndex === undefined
      ? notes.trim()
      : notes.slice(0, firstMarkerIndex).trim();

  const parsedStyle = parseJsonAfterMarker<Partial<PinStyleExtras>>(
    notes,
    PIN_STYLE_MARKER
  );
  const parsedPlacement = parseJsonAfterMarker<Partial<PinPlacementExtras>>(
    notes,
    PIN_PLACEMENT_MARKER
  );

  return {
    additionalComments,
    extras: {
      whiteCenter: Boolean(parsedStyle?.whiteCenter),
      animated: Boolean(parsedStyle?.animated),
      categoryBadge:
        typeof parsedStyle?.categoryBadge === "string" &&
        parsedStyle.categoryBadge.trim()
          ? parsedStyle.categoryBadge.trim()
          : null,
    },
    placement: {
      manualPlacement: Boolean(parsedPlacement?.manualPlacement),
      reverseGeocodedAddress:
        typeof parsedPlacement?.reverseGeocodedAddress === "string" &&
        parsedPlacement.reverseGeocodedAddress.trim()
          ? parsedPlacement.reverseGeocodedAddress.trim()
          : null,
    },
  };
}

export function resolvePinStyleExtras(buildRequest: {
  notes?: string | null;
  future_pin_white_center?: boolean | null;
  future_pin_animated?: boolean | null;
  future_pin_category_badge?: string | null;
}): PinStyleExtras {
  const fromNotes = decodePinStyleFromNotes(buildRequest.notes).extras;
  return {
    whiteCenter: buildRequest.future_pin_white_center ?? fromNotes.whiteCenter,
    animated: buildRequest.future_pin_animated ?? fromNotes.animated,
    categoryBadge:
      buildRequest.future_pin_category_badge ?? fromNotes.categoryBadge,
  };
}

export function decodeListingLinksFromNotes(
  notes: string | null | undefined,
): ListingLinkExtras {
  const parsed = notes
    ? parseJsonAfterMarker<Partial<ListingLinkExtras>>(notes, LISTING_LINKS_MARKER)
    : null;
  return {
    mlsUrl: normalizeListingHref(parsed?.mlsUrl),
    brokerUrl: normalizeListingHref(parsed?.brokerUrl),
  };
}
