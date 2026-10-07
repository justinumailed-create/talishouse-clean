/**
 * Mapsite additional PIN capacity.
 * Every Mapsite includes 1 PIN. Owners buy more at $10 USD each, up to 100 total.
 */

export const MAPSITE_INCLUDED_PIN_COUNT = 1;
export const MAPSITE_MAX_PIN_COUNT = 100;
export const MAPSITE_ADDITIONAL_PIN_PRICE_CENTS = 1000;
export const MAPSITE_ADDITIONAL_PIN_CURRENCY = "usd" as const;
export const ADDITIONAL_PINS_CHECKOUT_PURPOSE = "additional_pins";

export const PIN_CHECKOUT_QUERY = "pinCheckout";
export const PIN_CHECKOUT_SESSION_QUERY = "pin_session_id";

const MAX_PURCHASED_PINS = MAPSITE_MAX_PIN_COUNT - MAPSITE_INCLUDED_PIN_COUNT;
const CHECKOUT_SESSION_ID = /^cs_[A-Za-z0-9_]+$/;

export type MapSiteAdditionalPin = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  sortOrder: number;
};

export type MapSitePinCapacity = {
  pinQuota: number;
  purchasedPins: number;
  placedPins: number;
  remainingPurchasable: number;
  remainingToPlace: number;
  unitPriceCents: number;
  currency: typeof MAPSITE_ADDITIONAL_PIN_CURRENCY;
  maxPins: number;
};

export type MapSitePinDashboardState = MapSitePinCapacity & {
  pins: MapSiteAdditionalPin[];
};

export function defaultMapSitePinDashboard(): MapSitePinDashboardState {
  return capacityFromCounts({
    pinQuota: MAPSITE_INCLUDED_PIN_COUNT,
    purchasedPins: 0,
    placedPins: 0,
    pins: [],
  });
}

export function clampPinQuota(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return MAPSITE_INCLUDED_PIN_COUNT;
  const rounded = Math.trunc(value);
  if (rounded < MAPSITE_INCLUDED_PIN_COUNT) return MAPSITE_INCLUDED_PIN_COUNT;
  if (rounded > MAPSITE_MAX_PIN_COUNT) return MAPSITE_MAX_PIN_COUNT;
  return rounded;
}

export function clampPurchasedPins(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  const rounded = Math.trunc(value);
  if (rounded < 0) return 0;
  if (rounded > MAX_PURCHASED_PINS) return MAX_PURCHASED_PINS;
  return rounded;
}

export function resolvePinQuota(input: {
  pinQuota?: number | null;
  purchasedPins?: number | null;
}): { pinQuota: number; purchasedPins: number } {
  const purchasedPins = clampPurchasedPins(input.purchasedPins);
  const storedQuota = clampPinQuota(input.pinQuota);
  const fromPurchases = MAPSITE_INCLUDED_PIN_COUNT + purchasedPins;
  const pinQuota = Math.min(
    MAPSITE_MAX_PIN_COUNT,
    Math.max(storedQuota, fromPurchases),
  );
  return {
    pinQuota,
    purchasedPins: Math.min(purchasedPins, pinQuota - MAPSITE_INCLUDED_PIN_COUNT),
  };
}

export function remainingPurchasablePins(pinQuota: number): number {
  return Math.max(0, MAPSITE_MAX_PIN_COUNT - clampPinQuota(pinQuota));
}

export function remainingPinsToPlace(
  pinQuota: number,
  placedAdditional: number,
): number {
  const placed = Math.max(0, Math.trunc(placedAdditional) || 0);
  return Math.max(
    0,
    clampPinQuota(pinQuota) - MAPSITE_INCLUDED_PIN_COUNT - placed,
  );
}

export function capacityFromCounts(input: {
  pinQuota?: number | null;
  purchasedPins?: number | null;
  placedPins: number;
  pins?: MapSiteAdditionalPin[];
}): MapSitePinDashboardState {
  const resolved = resolvePinQuota(input);
  const placedPins = Math.max(0, Math.trunc(input.placedPins) || 0);
  return {
    pinQuota: resolved.pinQuota,
    purchasedPins: resolved.purchasedPins,
    placedPins,
    remainingPurchasable: remainingPurchasablePins(resolved.pinQuota),
    remainingToPlace: remainingPinsToPlace(resolved.pinQuota, placedPins),
    unitPriceCents: MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
    currency: MAPSITE_ADDITIONAL_PIN_CURRENCY,
    maxPins: MAPSITE_MAX_PIN_COUNT,
    pins: input.pins ?? [],
  };
}

export function additionalPinCheckoutQuantityError(
  pinQuota: number,
  quantity: number,
): string | null {
  const room = remainingPurchasablePins(pinQuota);
  if (room <= 0) {
    return "This Mapsite already has the maximum of 100 PINs.";
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Choose at least 1 PIN.";
  }
  if (quantity > room) {
    return room === 1
      ? "You can add 1 more PIN."
      : `You can add up to ${room} more PINs.`;
  }
  return null;
}

export function additionalPinPriceCents(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) return 0;
  return quantity * MAPSITE_ADDITIONAL_PIN_PRICE_CENTS;
}

export function formatUsdFromCents(cents: number): string {
  const amount = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatAdditionalPinCheckoutLabel(quantity: number): string {
  const countLabel = quantity === 1 ? "1 PIN" : `${quantity} PINs`;
  return `Buy ${countLabel} · ${formatUsdFromCents(additionalPinPriceCents(quantity))} USD`;
}

export type PinGrantDecision = {
  pinQuota: number;
  purchasedPins: number;
  granted: number;
};

/** How many paid PINs to add without passing 100. */
export function grantAdditionalPins(
  current: { pinQuota?: number | null; purchasedPins?: number | null },
  quantity: number,
): PinGrantDecision | { error: string } {
  const quantityError = additionalPinCheckoutQuantityError(
    resolvePinQuota(current).pinQuota,
    quantity,
  );
  if (quantityError && remainingPurchasablePins(resolvePinQuota(current).pinQuota) <= 0) {
    return { error: quantityError };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: quantityError || "Choose at least 1 PIN." };
  }

  const resolved = resolvePinQuota(current);
  const granted = Math.min(quantity, remainingPurchasablePins(resolved.pinQuota));
  if (granted <= 0) {
    return { error: "This Mapsite already has the maximum of 100 PINs." };
  }

  return {
    pinQuota: Math.min(MAPSITE_MAX_PIN_COUNT, resolved.pinQuota + granted),
    purchasedPins: Math.min(MAX_PURCHASED_PINS, resolved.purchasedPins + granted),
    granted,
  };
}

export function canPlaceAnotherPin(
  pinQuota: number,
  placedAdditional: number,
): boolean {
  return remainingPinsToPlace(pinQuota, placedAdditional) > 0;
}

export function additionalPinPaymentMatches(input: {
  quantity: number;
  amountTotal: number | null;
  currency: string | null;
}): boolean {
  if (input.amountTotal == null || !Number.isFinite(input.amountTotal)) return false;
  if ((input.currency || "").toLowerCase() !== MAPSITE_ADDITIONAL_PIN_CURRENCY) {
    return false;
  }
  return input.amountTotal === additionalPinPriceCents(input.quantity);
}

export function isAdditionalPinsCheckout(
  metadata: { purpose?: string | null } | null | undefined,
): boolean {
  return metadata?.purpose === ADDITIONAL_PINS_CHECKOUT_PURPOSE;
}

export function quantityFromCheckoutMetadata(
  metadata: { quantity?: string | null } | null | undefined,
): number | null {
  const raw = metadata?.quantity?.trim() || "";
  if (!/^\d+$/.test(raw)) return null;
  const quantity = Number(raw);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PURCHASED_PINS) {
    return null;
  }
  return quantity;
}

export function normalizePinLabel(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function normalizePinCoordinate(
  value: number,
  axis: "lat" | "lng",
): number | null {
  if (!Number.isFinite(value)) return null;
  if (axis === "lat" && (value < -90 || value > 90)) return null;
  if (axis === "lng" && (value < -180 || value > 180)) return null;
  return Math.round(value * 1e6) / 1e6;
}

export function parsePinCheckoutStatus(
  value: string | null | undefined,
): "success" | "cancelled" | null {
  if (value === "success" || value === "cancelled") return value;
  return null;
}

export function parsePinCheckoutSessionId(
  value: string | null | undefined,
): string | null {
  const sessionId = value?.trim() || "";
  if (!CHECKOUT_SESSION_ID.test(sessionId)) return null;
  return sessionId;
}
