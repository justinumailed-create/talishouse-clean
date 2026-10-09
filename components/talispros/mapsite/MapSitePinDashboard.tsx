"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  createAdditionalPinCheckout,
  deleteMapSiteAdditionalPin,
  fixMapSiteAdditionalPin,
  placeMapSiteAdditionalPin,
} from "@/app/talispros/mapsite/pin-actions";
import {
  formatAdditionalPinMoneyFromCents,
  normalizePinCoordinate,
  splitFreeAndPaidPins,
  type MapSitePinDashboardState,
} from "@/lib/talispros/mapsite-additional-pins";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import MapSitePlaceSearch, {
  type MapSitePlaceSelection,
} from "@/components/talispros/mapsite/MapSitePlaceSearch";

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
  const t = useT();
  const d = t.mapsite.pinDashboard;
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const [label, setLabel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [paused, setPaused] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lastPlacedId, setLastPlacedId] = useState<string | null>(null);
  const knownPinIdsRef = useRef<Set<string> | null>(null);
  const { setViewport } = useMapEngine();

  // Placement is always ready while the panel is open (unless the owner pauses it):
  // map clicks drop the next PIN and every placed PIN can be dragged.
  useEffect(() => {
    if (open && !paused && editor.kind === "idle") {
      onEditorChange({ kind: "place" });
    }
  }, [open, paused, editor.kind, onEditorChange]);

  // A newly placed PIN (search, coordinates or map click) opens for naming + Undo.
  const pinIdsKey = dashboard.pins.map((pin) => pin.id).join("|");
  useEffect(() => {
    const ids = new Set(pinIdsKey ? pinIdsKey.split("|") : []);
    const known = knownPinIdsRef.current;
    knownPinIdsRef.current = ids;
    if (!known) return;
    const added = [...ids].filter((id) => !known.has(id));
    if (added.length !== 1) return;
    const pin = dashboard.pins.find((item) => item.id === added[0]);
    setLastPlacedId(added[0]);
    setEditingId(added[0]);
    setEditLabel(pin?.label || "");
    setConfirmDeleteId(null);
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinIdsKey]);

  if (!open) return null;

  const room = dashboard.remainingPurchasable;
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(room, 1));
  const atMax = room <= 0;
  const freeCredits = dashboard.freePinCredits ?? 0;
  const split = splitFreeAndPaidPins(safeQuantity, freeCredits);

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
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      if (result.dashboard) {
        onDashboardChange(result.dashboard);
        setQuantity(1);
        setMessage(
          result.freeRedeemed === 1
            ? d.freeAddedOne
            : fmt(d.freeAddedMany, { count: result.freeRedeemed }),
        );
        return;
      }
      setError(result.error || d.errCheckout);
    });
  }

  function placeAt(lat: number, lng: number, pinLabel: string, onDone?: () => void) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await placeMapSiteAdditionalPin({
        mapsiteId,
        fastCode,
        latitude: lat,
        longitude: lng,
        label: pinLabel,
      });
      if (!("dashboard" in result)) {
        setError(result.error);
        return;
      }
      onDashboardChange(result.dashboard);
      onDone?.();
    });
  }

  function placeFromSearch(place: MapSitePlaceSelection) {
    const lat = normalizePinCoordinate(place.latitude, "lat");
    const lng = normalizePinCoordinate(place.longitude, "lng");
    if (lat == null || lng == null) return;
    setViewport({ center: { latitude: lat, longitude: lng }, zoom: 18 });
    // Only the label is stored (no address column); default to the place name.
    placeAt(lat, lng, place.name || place.formattedAddress);
  }

  function placeFromForm() {
    const lat = normalizePinCoordinate(Number(latitude), "lat");
    const lng = normalizePinCoordinate(Number(longitude), "lng");
    if (latitude.trim() === "" || longitude.trim() === "" || lat == null || lng == null) {
      setError(d.errCoordsOrMap);
      return;
    }
    setViewport({ center: { latitude: lat, longitude: lng }, zoom: 18 });
    placeAt(lat, lng, label, () => {
      setLabel("");
      setLatitude("");
      setLongitude("");
    });
  }

  function startEdit(pinId: string) {
    const pin = dashboard.pins.find((item) => item.id === pinId);
    setError(null);
    setMessage(null);
    setConfirmDeleteId(null);
    setEditLabel(pin?.label || "");
    setEditingId(pinId);
  }

  function saveLabel(pinId: string) {
    const pin = dashboard.pins.find((item) => item.id === pinId);
    if (!pin) return;
    setError(null);
    startTransition(async () => {
      const result = await fixMapSiteAdditionalPin({
        mapsiteId,
        fastCode,
        pinId: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        label: editLabel,
      });
      if (!report(result)) return;
      setEditingId(null);
      setMessage(d.updated);
    });
  }

  function removePin(pinId: string) {
    setError(null);
    setMessage(null);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await deleteMapSiteAdditionalPin({ mapsiteId, fastCode, pinId });
      if (!report(result)) return;
      if (editingId === pinId) setEditingId(null);
      if (lastPlacedId === pinId) setLastPlacedId(null);
      setMessage(d.deleted);
    });
  }

  function togglePaused() {
    setError(null);
    const next = !paused;
    setPaused(next);
    onEditorChange(next ? { kind: "idle" } : { kind: "place" });
  }

  const checkoutNote =
    checkoutStatus === "success"
      ? d.checkoutSuccess
      : checkoutStatus === "cancelled"
        ? d.checkoutCancelled
        : null;

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      className="pointer-events-auto absolute right-3 top-3 z-30 flex max-h-[min(72vh,40rem)] w-[min(calc(100%-1.5rem),22rem)] flex-col overflow-hidden rounded-xl bg-white text-neutral-900 shadow-xl sm:right-4 sm:top-4"
    >
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Mapsites
          </p>
          <h2 id={titleId} className="text-sm font-semibold">
            {d.title}
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
          {t.mapsite.close}
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
            <dt className="text-neutral-500">{d.included}</dt>
            <dd className="font-semibold">{d.onePin}</dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">{d.capacity}</dt>
            <dd className="font-semibold">
              {dashboard.pinQuota} / {dashboard.maxPins}
            </dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">{d.purchased}</dt>
            <dd className="font-semibold">{dashboard.purchasedPins}</dd>
          </div>
          <div className="rounded-md bg-neutral-50 px-2 py-1.5">
            <dt className="text-neutral-500">{d.readyToPlace}</dt>
            <dd className="font-semibold">{dashboard.remainingToPlace}</dd>
          </div>
          {freeCredits > 0 ? (
            <div className="col-span-2 rounded-md bg-emerald-50 px-2 py-1.5">
              <dt className="text-emerald-800">{d.freeCredits}</dt>
              <dd className="font-semibold text-emerald-900">{freeCredits}</dd>
            </div>
          ) : null}
        </dl>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {fmt(d.buyHeading, { price: formatAdditionalPinMoneyFromCents(dashboard.unitPriceCents) })}
          </h3>
          {freeCredits > 0 && !atMax ? (
            <p className="text-[11px] text-emerald-800">
              {freeCredits === 1
                ? d.freeAvailableOne
                : fmt(d.freeAvailableMany, { count: freeCredits })}
            </p>
          ) : null}
          {atMax ? (
            <p className="text-xs text-neutral-600">
              {d.atLimit}
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <label htmlFor={quantityId} className="text-xs text-neutral-600">
                {d.quantity}
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
                {pending
                  ? split.paid === 0
                    ? d.applyingFree
                    : d.startingCheckout
                  : split.free === 0
                    ? fmt(safeQuantity === 1 ? d.buyOne : d.buyMany, {
                        count: safeQuantity,
                        price: formatAdditionalPinMoneyFromCents(split.paidCents),
                      })
                    : split.paid === 0
                      ? split.free === 1
                        ? d.useFreeOne
                        : fmt(d.useFreeMany, { count: split.free })
                      : fmt(d.useFreeAndBuy, {
                          free: split.free,
                          paid: split.paid,
                          price: formatAdditionalPinMoneyFromCents(split.paidCents),
                        })}
              </button>
            </div>
          )}
          <p className="text-[11px] text-neutral-500">
            {room === 1 ? d.leftOne : fmt(d.leftMany, { count: room })}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {d.placeHeading}
            </h3>
            {dashboard.remainingToPlace > 0 || paused ? (
              <button
                type="button"
                onClick={togglePaused}
                className="rounded-md px-2 py-0.5 text-[11px] font-medium text-neutral-600 underline-offset-2 hover:underline"
              >
                {paused ? d.resumePlacing : d.stopPlacing}
              </button>
            ) : null}
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            {searchAvailable ? d.placeHelp : d.placeHelpMapOnly}
          </p>

          {dashboard.remainingToPlace > 0 ? (
            <>
              {!paused ? (
                <MapSitePlaceSearch
                  label={d.searchLabel}
                  placeholder={d.searchPlaceholder}
                  noResults={d.searchNoResults}
                  disabled={pending}
                  onSelect={placeFromSearch}
                  onAvailabilityChange={setSearchAvailable}
                />
              ) : null}
              <p
                className={`text-[11px] font-medium ${paused ? "text-neutral-500" : "text-sky-800"}`}
              >
                {paused
                  ? d.pausedHint
                  : dashboard.remainingToPlace === 1
                    ? d.readyOne
                    : fmt(d.readyMany, { count: dashboard.remainingToPlace })}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-neutral-500">{d.allPlaced}</p>
          )}

          {lastPlacedId && dashboard.pins.some((pin) => pin.id === lastPlacedId) ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
              <span>{d.placed}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => removePin(lastPlacedId)}
                className="font-semibold underline underline-offset-2 disabled:opacity-60"
              >
                {d.undo}
              </button>
            </div>
          ) : null}

          {dashboard.remainingToPlace > 0 && !paused ? (
            <details className="rounded-md border border-neutral-200 px-2 py-1.5">
              <summary className="cursor-pointer text-[11px] font-medium text-neutral-600">
                {d.advancedCoords}
              </summary>
              <div className="mt-2 space-y-2">
                <label className="block text-xs text-neutral-600">
                  {d.label}
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    maxLength={80}
                    placeholder={d.labelPlaceholder}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-neutral-600">
                    {d.latitude}
                    <input
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      inputMode="decimal"
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="block text-xs text-neutral-600">
                    {d.longitude}
                    <input
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      inputMode="decimal"
                      className="mt-1 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={placeFromForm}
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {d.placeAtCoords}
                </button>
              </div>
            </details>
          ) : null}

          {dashboard.pins.length === 0 ? (
            <p className="text-xs text-neutral-500">{d.noneYet}</p>
          ) : (
            <ul className="space-y-1.5">
              {dashboard.pins.map((pin, index) => (
                <li
                  key={pin.id}
                  className="rounded-md border border-neutral-200 px-2 py-1.5"
                >
                  {editingId === pin.id ? (
                    <div className="space-y-1.5">
                      <input
                        value={editLabel}
                        onChange={(event) => setEditLabel(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveLabel(pin.id);
                          } else if (event.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        maxLength={80}
                        autoFocus
                        aria-label={d.label}
                        placeholder={d.labelPlaceholder}
                        className="block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => saveLabel(pin.id)}
                          className="rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                        >
                          {d.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                        >
                          {d.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium">
                          {pin.label.trim() || `PIN ${index + 2}`}
                        </span>
                        <span className="block font-mono text-[10px] text-neutral-500">
                          {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(pin.id)}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                        >
                          {d.edit}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (confirmDeleteId === pin.id) {
                              removePin(pin.id);
                            } else {
                              setConfirmDeleteId(pin.id);
                            }
                          }}
                          onBlur={() =>
                            setConfirmDeleteId((current) => (current === pin.id ? null : current))
                          }
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-60 ${
                            confirmDeleteId === pin.id
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-neutral-300 text-red-700"
                          }`}
                        >
                          {confirmDeleteId === pin.id ? d.confirmDelete : d.delete}
                        </button>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
