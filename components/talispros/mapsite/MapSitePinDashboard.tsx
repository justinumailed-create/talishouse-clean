"use client";

import { useId, useState, useTransition } from "react";
import {
  createAdditionalPinCheckout,
  fixMapSiteAdditionalPin,
  placeMapSiteAdditionalPin,
} from "@/app/talispros/mapsite/pin-actions";
import {
  formatAdditionalPinCheckoutLabel,
  formatUsdFromCents,
  normalizePinCoordinate,
  type MapSitePinDashboardState,
} from "@/lib/talispros/mapsite-additional-pins";

export type PinEditorState =
  | { kind: "idle" }
  | { kind: "place" }
  | { kind: "fix"; pinId: string };

type MapSitePinDashboardProps = {
  open: boolean;
  mapsiteId: string;
  fastCode: string;
  accountTypeSegment?: string | null;
  dashboard: MapSitePinDashboardState;
  editor: PinEditorState;
  checkoutStatus: "success" | "cancelled" | null;
  onClose: () => void;
  onDashboardChange: (dashboard: MapSitePinDashboardState) => void;
  onEditorChange: (editor: PinEditorState) => void;
};

export default function MapSitePinDashboard({
  open,
  mapsiteId,
  fastCode,
  accountTypeSegment = null,
  dashboard,
  editor,
  checkoutStatus,
  onClose,
  onDashboardChange,
  onEditorChange,
}: MapSitePinDashboardProps) {
  const titleId = useId();
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const [label, setLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const room = dashboard.remainingPurchasable;
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(room, 1));
  const atMax = room <= 0;
  const fixing =
    editor.kind === "fix"
      ? dashboard.pins.find((pin) => pin.id === editor.pinId) ?? null
      : null;

  function report(result: { error?: string; dashboard?: MapSitePinDashboardState }) {
    if (result.error) {
      setError(result.error);
      setMessage(null);
      return false;
    }
    if (result.dashboard) onDashboardChange(result.dashboard);
    setError(null);
    return true;
  }

  function buyPins() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createAdditionalPinCheckout({
        mapsiteId,
        fastCode,
        quantity: safeQuantity,
        accountTypeSegment,
      });
      if ("url" in result && result.url) {
        window.location.assign(result.url);
        return;
      }
      setError("error" in result ? result.error : "Unable to start checkout.");
    });
  }

  function placeFromForm() {
    const lat = normalizePinCoordinate(Number(latitude), "lat");
    const lng = normalizePinCoordinate(Number(longitude), "lng");
    if (lat == null || lng == null) {
      setError("Enter a valid latitude and longitude, or click the map.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await placeMapSiteAdditionalPin({
        mapsiteId,
        fastCode,
        latitude: lat,
        longitude: lng,
        label,
      });
      if (!("dashboard" in result)) {
        setError(result.error);
        setMessage(null);
        return;
      }
      onDashboardChange(result.dashboard);
      setError(null);
      setMessage("PIN placed.");
      setLabel("");
      setLatitude("");
      setLongitude("");
      onEditorChange(
        result.dashboard.remainingToPlace > 0 ? { kind: "place" } : { kind: "idle" },
      );
    });
  }

  function saveFix() {
    if (!fixing) return;
    const lat = normalizePinCoordinate(Number(latitude || fixing.latitude), "lat");
    const lng = normalizePinCoordinate(Number(longitude || fixing.longitude), "lng");
    if (lat == null || lng == null) {
      setError("Enter a valid latitude and longitude.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await fixMapSiteAdditionalPin({
        mapsiteId,
        fastCode,
        pinId: fixing.id,
        latitude: lat,
        longitude: lng,
        label: label || fixing.label,
      });
      if (!report(result)) return;
      setMessage("PIN updated.");
      onEditorChange({ kind: "idle" });
    });
  }

  function startFix(pinId: string) {
    const pin = dashboard.pins.find((item) => item.id === pinId);
    setError(null);
    setMessage(null);
    setLabel(pin?.label || "");
    setLatitude(pin ? String(pin.latitude) : "");
    setLongitude(pin ? String(pin.longitude) : "");
    onEditorChange({ kind: "fix", pinId });
  }

  const checkoutNote =
    checkoutStatus === "success"
      ? "Payment received. PIN capacity updates as soon as Stripe confirms it."
      : checkoutStatus === "cancelled"
        ? "Checkout cancelled. No PINs were added."
        : null;

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      className="pointer-events-auto absolute bottom-3 left-3 z-30 flex max-h-[min(72vh,40rem)] w-[min(calc(100%-1.5rem),22rem)] flex-col overflow-hidden rounded-xl bg-white text-neutral-900 shadow-xl"
    >
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Mapsites™
          </p>
          <h2 id={titleId} className="text-sm font-semibold">
            PIN Dashboard
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
            FAST Code™ {fastCode.trim().toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Close
        </button>
      </header>

      <div className="space-y-4 overflow-y-auto px-4 py-3 text-sm">
        {checkoutNote ? (
          <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {checkoutNote}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">Included</dt>
            <dd className="font-semibold">1 PIN</dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">Capacity</dt>
            <dd className="font-semibold">
              {dashboard.pinQuota} / {dashboard.maxPins}
            </dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">Purchased</dt>
            <dd className="font-semibold">{dashboard.purchasedPins}</dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">Ready to place</dt>
            <dd className="font-semibold">{dashboard.remainingToPlace}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Buy PINs · {formatUsdFromCents(dashboard.unitPriceCents)} USD each
          </h3>
          {atMax ? (
            <p className="text-xs text-neutral-600">
              This Mapsite™ is at the 100 PIN limit.
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <label htmlFor={quantityId} className="text-xs text-neutral-600">
                Quantity
                <input
                  id={quantityId}
                  type="number"
                  min={1}
                  max={room}
                  value={safeQuantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setQuantity(Number.isFinite(next) ? next : 1);
                  }}
                  className="mt-1 block w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={buyPins}
                disabled={pending}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Starting checkout…" : formatAdditionalPinCheckoutLabel(safeQuantity)}
              </button>
            </div>
          )}
          <p className="text-[11px] text-neutral-500">
            {room} PIN{room === 1 ? "" : "s"} left to purchase.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Place and fix
          </h3>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            The included PIN stays on the listing. Place purchased PINs by clicking
            the map, or enter coordinates. Drag a PIN, or edit it here, to fix the location.
          </p>
          <button
            type="button"
            disabled={pending || dashboard.remainingToPlace <= 0}
            onClick={() => {
              setError(null);
              setMessage(null);
              setLabel("");
              setLatitude("");
              setLongitude("");
              onEditorChange(
                editor.kind === "place" ? { kind: "idle" } : { kind: "place" },
              );
            }}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {editor.kind === "place" ? "Cancel placement" : "Place a PIN"}
          </button>
          {editor.kind === "place" ? (
            <p className="text-[11px] font-medium text-sky-800">
              Click the map to drop the next PIN.
            </p>
          ) : null}

          {editor.kind === "place" || fixing ? (
            <div className="space-y-2 rounded-md border border-neutral-200 p-2">
              <label className="block text-xs text-neutral-600">
                Label
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={80}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-neutral-600">
                  Latitude
                  <input
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    inputMode="decimal"
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="block text-xs text-neutral-600">
                  Longitude
                  <input
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    inputMode="decimal"
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
              </div>
              {editor.kind === "place" ? (
                <button
                  type="button"
                  onClick={placeFromForm}
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Place at coordinates
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveFix}
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Save PIN
                </button>
              )}
            </div>
          ) : null}

          {dashboard.pins.length === 0 ? (
            <p className="text-xs text-neutral-500">No additional PINs placed yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {dashboard.pins.map((pin, index) => (
                <li
                  key={pin.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">
                      {pin.label.trim() || `PIN ${index + 2}`}
                    </span>
                    <span className="block font-mono text-[10px] text-neutral-500">
                      {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => startFix(pin.id)}
                    className="shrink-0 rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                  >
                    {editor.kind === "fix" && editor.pinId === pin.id
                      ? "Fixing"
                      : "Fix"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
