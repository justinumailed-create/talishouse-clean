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
import type { PinCategoryOption } from "@/lib/talispros/mapsite-pin-categories";
import SamCartWebCheckout from "@/components/talisu/SamCartWebCheckout";
import { useMapSiteDashboardEmbedded } from "@/components/talispros/mapsite/MapSiteDashboardChrome";
import {
  PIN_ASSIGNMENT_RULES,
  normalizeAssignedFastCode,
  validatePinAssignment,
  type PinAccountLevel,
} from "@/lib/talispros/mapsite-pin-assignment";
import {
  clearFormDraft,
  draftString,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from "@/lib/talispros/form-drafts";

/** localStorage scope for unsaved Add Pin work, keyed per Mapsite. */
export const MAPSITE_PIN_DRAFT_SCOPE = "mapsite-pin";

type PinDraft = {
  label: string;
  latitude: string;
  longitude: string;
  placeCategory: string;
  editingId: string;
  editLabel: string;
  editCategory: string;
  /** Assign to Mapsite: FAST Code for the next PIN (kept across tabs). */
  assignFastCode: string;
  /** Assign to Mapsite while editing a placed PIN. */
  editAssign: string;
};

/** One visible screen in the sequential Add Pin flow. */
type FlowScreen = 1 | 2 | 3 | 4;

function initialFlowScreen(draft: PinDraft | null): FlowScreen {
  if (!draft) return 1;
  if (draft.editingId) return 3;
  if (draft.label.trim() || draft.latitude.trim() || draft.longitude.trim()) return 2;
  return 1;
}

/** Slim progress bar for the one-screen-at-a-time Add Pin flow. Not a numbered card stepper. */
function PinFlowProgress({
  screen,
  label,
  status,
}: {
  screen: FlowScreen;
  label: string;
  status: string;
}) {
  return (
    <div className="space-y-2" data-testid="pin-flow-progress">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">{label}</h3>
        <p className="shrink-0 text-[11px] font-medium tabular-nums text-neutral-500">{status}</p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={screen}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[#046BD9] transition-[width] duration-300 ease-out"
          style={{ width: `${(screen / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}

function PinFlowNav({
  backLabel,
  continueLabel,
  continueDisabled = false,
  onBack,
  onContinue,
}: {
  backLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1" data-testid="pin-flow-nav">
      {onBack && backLabel ? (
        <button
          type="button"
          onClick={onBack}
          data-testid="pin-flow-back"
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onContinue && continueLabel ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          data-testid="pin-flow-continue"
          className="ml-auto rounded-full bg-[#046BD9] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0358b3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {continueLabel}
        </button>
      ) : null}
    </div>
  );
}

export type PinEditorState =
  | { kind: "idle" }
  /** assignedFastCode: Assign to Mapsite value used for map-click placement. */
  | { kind: "place"; assignedFastCode?: string | null }
  | { kind: "fix"; pinId: string };

type MapSitePinDashboardProps = {
  open: boolean;
  mapsiteId: string;
  fastCode: string;
  accountTypeSegment?: string | null;
  dashboard: MapSitePinDashboardState;
  /** Broker, FSBO, Ad Pro or Agent: drives the Assign to Mapsite rules. */
  accountLevel?: PinAccountLevel;
  /** Five mandatory + the Root's custom categories (Ralf, Oct 17). */
  categoryOptions?: ReadonlyArray<PinCategoryOption>;
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
  accountLevel = "broker",
  categoryOptions = [],
  editor,
  checkoutStatus,
  onClose,
  onDashboardChange,
  onEditorChange,
}: MapSitePinDashboardProps) {
  const titleId = useId();
  const t = useT();
  const embedded = useMapSiteDashboardEmbedded();
  const d = t.mapsite.pinDashboard;
  const quantityId = useId();
  const draftKey = formDraftKey(MAPSITE_PIN_DRAFT_SCOPE, mapsiteId || fastCode);
  // Resume unsaved Add Pin work for this Mapsite (another tab, a reload, or
  // coming back after opening a different listing).
  const [initialDraft] = useState<PinDraft | null>(() => {
    const draft = readFormDraft<PinDraft>(draftKey);
    if (!draft) return null;
    const editing = draftString(draft.editingId);
    const restored: PinDraft = {
      label: draftString(draft.label),
      latitude: draftString(draft.latitude),
      longitude: draftString(draft.longitude),
      placeCategory: draftString(draft.placeCategory),
      editingId: editing && dashboard.pins.some((pin) => pin.id === editing) ? editing : "",
      editLabel: draftString(draft.editLabel),
      editCategory: draftString(draft.editCategory),
      assignFastCode: draftString(draft.assignFastCode),
      editAssign: draftString(draft.editAssign),
    };
    return pinDraftHasWork(restored) ? restored : null;
  });
  // Only unsaved PIN work shows the notice; a remembered assignment alone does not.
  const [draftRestored, setDraftRestored] = useState(
    pinDraftHasWork(initialDraft, { includeAssignment: false }),
  );
  const assignRule = PIN_ASSIGNMENT_RULES[accountLevel];
  const [assignFastCode, setAssignFastCode] = useState(initialDraft?.assignFastCode ?? "");
  const [editAssign, setEditAssign] = useState(initialDraft?.editingId ? initialDraft.editAssign : "");
  const [quantity, setQuantity] = useState(1);
  const [label, setLabel] = useState(initialDraft?.label ?? "");
  const [latitude, setLatitude] = useState(initialDraft?.latitude ?? "");
  const [longitude, setLongitude] = useState(initialDraft?.longitude ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [samcartOpen, setSamcartOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [paused, setPaused] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(initialDraft?.editingId || null);
  const [editLabel, setEditLabel] = useState(initialDraft?.editingId ? initialDraft.editLabel : "");
  const [editCategory, setEditCategory] = useState(
    initialDraft?.editingId ? initialDraft.editCategory : "",
  );
  const [placeCategory, setPlaceCategory] = useState(initialDraft?.placeCategory ?? "");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lastPlacedId, setLastPlacedId] = useState<string | null>(null);
  const [flowScreen, setFlowScreen] = useState<FlowScreen>(() => initialFlowScreen(initialDraft));
  const knownPinIdsRef = useRef<Set<string> | null>(null);
  const { setViewport } = useMapEngine();

  const assignCheck = validatePinAssignment({
    level: accountLevel,
    ownFastCode: fastCode,
    assignedFastCode: assignFastCode,
  });
  // Agents cannot place until a Broker FAST Code is entered.
  const placementReady = assignCheck.ok;
  const placeAssignment = assignCheck.ok ? assignCheck.assignedFastCode : null;
  const editorAssignment = editor.kind === "place" ? editor.assignedFastCode ?? null : null;

  // Map-click placement is only active on the Find a place screen, unless the
  // owner pauses it or an Agent still has to assign a Mapsite.
  useEffect(() => {
    if (!open) return;
    const placing = !paused && placementReady && flowScreen === 2;
    if (!placing) {
      if (editor.kind === "place") onEditorChange({ kind: "idle" });
      return;
    }
    if (editor.kind === "idle" || (editor.kind === "place" && editorAssignment !== placeAssignment)) {
      onEditorChange({ kind: "place", assignedFastCode: placeAssignment });
    }
  }, [open, paused, flowScreen, placementReady, placeAssignment, editor.kind, editorAssignment, onEditorChange]);

  // Keep the draft in step with the form; nothing in progress clears it.
  useEffect(() => {
    const draft: PinDraft = {
      label,
      latitude,
      longitude,
      placeCategory,
      editingId: editingId ?? "",
      editLabel: editingId ? editLabel : "",
      editCategory: editingId ? editCategory : "",
      assignFastCode,
      editAssign: editingId ? editAssign : "",
    };
    if (pinDraftHasWork(draft)) writeFormDraft(draftKey, draft);
    else clearFormDraft(draftKey);
  }, [
    draftKey,
    label,
    latitude,
    longitude,
    placeCategory,
    editingId,
    editLabel,
    editCategory,
    assignFastCode,
    editAssign,
  ]);

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
    setEditCategory(pin?.category || "");
    setEditAssign((pin?.assignedFastCode || "").toUpperCase());
    setConfirmDeleteId(null);
    setMessage(null);
    setFlowScreen(3);
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
    if (split.paid > 0) {
      setSamcartOpen(true);
      if (split.free === 0) return;
    }
    startTransition(async () => {
      const result = await createAdditionalPinCheckout({
        mapsiteId,
        fastCode,
        quantity: split.paid > 0 ? split.free : safeQuantity,
        accountTypeSegment,
      });
      if (result.dashboard) {
        onDashboardChange(result.dashboard);
        if (split.paid === 0) {
          setQuantity(1);
          setMessage(
            result.freeRedeemed === 1
              ? d.freeAddedOne
              : fmt(d.freeAddedMany, { count: result.freeRedeemed }),
          );
        }
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
        category: placeCategory || null,
        assignedFastCode: placeAssignment,
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
    setEditCategory(pin?.category || "");
    setEditAssign((pin?.assignedFastCode || "").toUpperCase());
    setEditingId(pinId);
    setFlowScreen(3);
  }

  function saveLabel(pinId: string, advanceToReview = false) {
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
        category: editCategory || null,
        assignedFastCode: editAssign,
      });
      if (!report(result)) return;
      setEditingId(null);
      setEditLabel("");
      setEditCategory("");
      setEditAssign("");
      setDraftRestored(false);
      clearFormDraft(draftKey);
      setMessage(d.updated);
      if (advanceToReview) setFlowScreen(4);
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

  /** Explicit reset: forget the unsaved Add Pin draft for this Mapsite. */
  function startOver() {
    clearFormDraft(draftKey);
    setDraftRestored(false);
    setLabel("");
    setLatitude("");
    setLongitude("");
    setPlaceCategory("");
    setEditingId(null);
    setEditLabel("");
    setEditCategory("");
    setEditAssign("");
    setAssignFastCode("");
    setConfirmDeleteId(null);
    setLastPlacedId(null);
    setError(null);
    setMessage(null);
    setFlowScreen(1);
  }

  function togglePaused() {
    setError(null);
    const next = !paused;
    setPaused(next);
    onEditorChange(
      next || !placementReady || flowScreen !== 2
        ? { kind: "idle" }
        : { kind: "place", assignedFastCode: placeAssignment },
    );
  }

  function goAddAnotherPin() {
    setEditingId(null);
    setConfirmDeleteId(null);
    setError(null);
    setFlowScreen(1);
  }

  const checkoutNote =
    checkoutStatus === "success"
      ? d.checkoutSuccess
      : checkoutStatus === "cancelled"
        ? d.checkoutCancelled
        : null;

  const editingPin = editingId
    ? dashboard.pins.find((pin) => pin.id === editingId) ?? null
    : null;
  const editingIndex = editingPin ? dashboard.pins.indexOf(editingPin) : -1;
  const assignHelp =
    accountLevel === "agent"
      ? d.assignHelpAgent
      : accountLevel === "fsbo"
        ? d.assignHelpFsbo
        : accountLevel === "adpro"
          ? d.assignHelpAdpro
          : d.assignHelpBroker;
  const assignLevelName =
    accountLevel === "agent"
      ? d.levelAgent
      : accountLevel === "fsbo"
        ? d.levelFsbo
        : accountLevel === "adpro"
          ? d.levelAdpro
          : d.levelBroker;
  const assignError = assignCheck.ok
    ? null
    : assignCheck.error === "required"
      ? null
      : assignCheck.error === "self"
        ? d.assignSelf
        : d.assignInvalid;
  const assignShows = placeAssignment
    ? fmt(assignRule.ownMapsite ? d.assignShowsOn : d.assignShowsOnly, {
        code: placeAssignment.toUpperCase(),
      })
    : assignRule.ownMapsite
      ? d.assignShowsOwn
      : d.assignNeeded;
  const flowTitle =
    flowScreen === 1
      ? d.step1Title
      : flowScreen === 2
        ? d.step3Title
        : flowScreen === 3
          ? d.step4Title
          : d.step5Title;

  const morePinsSection = (
        <section
          id="additional-pins"
          className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
          data-testid="pin-more-pins"
        >
          <h3 className="text-[13px] font-semibold text-neutral-900">{d.moreTitle}</h3>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-white px-2 py-1.5">
              <dt className="text-neutral-500">{d.included}</dt>
              <dd className="font-semibold">{d.onePin}</dd>
            </div>
            <div className="rounded-md bg-white px-2 py-1.5">
              <dt className="text-neutral-500">{d.capacity}</dt>
              <dd className="font-semibold">
                {dashboard.pinQuota} / {dashboard.maxPins}
              </dd>
            </div>
            <div className="rounded-md bg-white px-2 py-1.5">
              <dt className="text-neutral-500">{d.purchased}</dt>
              <dd className="font-semibold">{dashboard.purchasedPins}</dd>
            </div>
            <div className="rounded-md bg-white px-2 py-1.5">
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
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {fmt(d.buyHeading, { price: formatAdditionalPinMoneyFromCents(dashboard.unitPriceCents) })}
          </h4>
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
                  className="mt-1 block w-20 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={buyPins}
                disabled={pending}
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
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
          {samcartOpen ? (
            <div className="space-y-2" data-testid="additional-pin-samcart">
              <p className="text-[12px] leading-snug text-neutral-700">{d.checkoutNote}</p>
              <SamCartWebCheckout product="listpin" subdomain="talispros" />
              <button
                type="button"
                className="text-[12px] font-medium text-neutral-600 underline"
                onClick={() => setSamcartOpen(false)}
              >
                {d.cancel}
              </button>
            </div>
          ) : null}
        </section>
  );

  const body = (
      <div className={embedded ? "space-y-4 text-sm" : "space-y-4 overflow-y-auto px-4 py-3 text-sm"}>
        <PinFlowProgress
          screen={flowScreen}
          label={flowTitle}
          status={fmt(d.flowOf, { current: flowScreen, total: 4 })}
        />
        {draftRestored ? (
          <div
            className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900"
            data-testid="pin-draft-restored"
          >
            <span>{d.draftRestored}</span>
            <button
              type="button"
              onClick={startOver}
              data-testid="pin-draft-start-over"
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              {d.startOver}
            </button>
          </div>
        ) : null}
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

        {flowScreen === 1 ? (
        <section data-testid="pin-step-1" className="space-y-3">
          <p className="text-[12px] leading-snug text-neutral-600">{d.step1Body}</p>
          <p
            className={`text-[12px] font-medium ${dashboard.remainingToPlace > 0 ? "text-[#035bb8]" : "text-neutral-600"}`}
            data-testid="pin-step-add-status"
          >
            {dashboard.remainingToPlace > 0
              ? dashboard.remainingToPlace === 1
                ? d.readyOne
                : fmt(d.readyMany, { count: dashboard.remainingToPlace })
              : d.allPlaced}
          </p>
          {dashboard.pins.length > 0 ? (
            <button
              type="button"
              onClick={() => setFlowScreen(4)}
              data-testid="pin-flow-view-existing"
              className="text-[12px] font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              {fmt(d.viewExistingPins, { count: dashboard.pins.length })}
            </button>
          ) : null}

          <div data-testid="pin-step-2" className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-semibold text-neutral-900">{d.step2Title}</h4>
                <p className="mt-0.5 text-[12px] leading-snug text-neutral-600">{assignHelp}</p>
              </div>
              <span
                data-testid="pin-assign-badge"
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  assignRule.required ? "bg-red-600 text-white" : "bg-white text-neutral-700 ring-1 ring-neutral-200"
                }`}
              >
                {assignRule.required ? d.assignRequired : d.assignOptional}
              </span>
            </div>
            <label className="block text-xs text-neutral-600" data-testid="pin-assign-to-mapsite">
              <span className="flex items-center justify-between gap-2">
                <span>{d.assignLabel}</span>
                <span className="text-[11px] text-neutral-500">{fmt(d.assignLevel, { level: assignLevelName })}</span>
              </span>
              <input
                value={assignFastCode}
                onChange={(event) => setAssignFastCode(event.target.value.toUpperCase())}
                maxLength={30}
                required={assignRule.required}
                aria-required={assignRule.required}
                aria-invalid={Boolean(assignError) || (assignRule.required && !placementReady)}
                autoComplete="off"
                spellCheck={false}
                placeholder={d.assignPlaceholder}
                data-testid="pin-assign-input"
                className={`mt-1 block w-full rounded-md border bg-white px-2 py-1.5 font-mono text-sm uppercase tracking-wide ${
                  assignError || (assignRule.required && !placementReady)
                    ? "border-red-400"
                    : "border-neutral-300"
                }`}
              />
            </label>
            {assignError ? (
              <p className="text-[11px] font-medium text-red-700" role="alert">
                {assignError}
              </p>
            ) : null}
            <p
              className={`text-[11px] font-semibold ${placementReady ? "text-teal-800" : "text-red-700"}`}
              data-testid="pin-assign-shows"
            >
              {assignShows}
            </p>
            {assignRule.ownMapsite && assignFastCode ? (
              <button
                type="button"
                onClick={() => setAssignFastCode("")}
                className="text-[11px] font-semibold text-neutral-600 underline underline-offset-2"
              >
                {d.assignUseOwn}
              </button>
            ) : null}
          </div>

          {!placementReady ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-[12px] font-medium text-teal-900" data-testid="pin-assign-needed">
              {d.assignNeeded}
            </p>
          ) : null}

          {dashboard.remainingToPlace <= 0 ? morePinsSection : null}

          <PinFlowNav
            continueLabel={d.continue}
            continueDisabled={!placementReady || dashboard.remainingToPlace <= 0}
            onContinue={() => setFlowScreen(2)}
          />
        </section>
        ) : null}

        {flowScreen === 2 ? (
        <section data-testid="pin-step-3" className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] leading-snug text-neutral-600">
              {searchAvailable ? d.step3Body : d.placeHelpMapOnly}
            </p>
            {dashboard.remainingToPlace > 0 || paused ? (
              <button
                type="button"
                onClick={togglePaused}
                className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
              >
                {paused ? d.resumePlacing : d.stopPlacing}
              </button>
            ) : null}
          </div>
          {dashboard.remainingToPlace > 0 && !placementReady ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-[12px] font-medium text-teal-900">
              {d.assignNeeded}
            </p>
          ) : dashboard.remainingToPlace > 0 ? (
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
              {paused ? (
                <p className="text-[11px] font-medium text-neutral-500">{d.pausedHint}</p>
              ) : null}
              {!paused ? (
                <details className="rounded-md border border-neutral-200 bg-white px-2 py-1.5">
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
            </>
          ) : (
            <p className="text-[12px] text-neutral-600">{d.allPlaced}</p>
          )}
          {dashboard.remainingToPlace > 0 && categoryOptions.length > 0 && !paused && placementReady ? (
            <label className="block text-xs text-neutral-600">
              {d.nextCategory}
              <select
                data-testid="pin-place-category"
                value={placeCategory}
                onChange={(event) => setPlaceCategory(event.target.value)}
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
              >
                <option value="">{d.noCategory}</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value} title={option.description ?? undefined}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
          <PinFlowNav
            backLabel={d.back}
            onBack={() => setFlowScreen(1)}
            continueLabel={d.continue}
            onContinue={() => setFlowScreen(3)}
          />
        </section>
        ) : null}

        {flowScreen === 3 ? (
        <section data-testid="pin-step-4" className="space-y-3">
          <p className="text-[12px] leading-snug text-neutral-600">
            {editingPin ? d.step4Body : d.step4Idle}
          </p>
          {editingPin ? (
            <div className="space-y-2" data-testid="pin-step-edit">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800">
                {editingPin.label.trim() || `PIN ${editingIndex + 2}`}
              </p>
              <label className="block text-xs text-neutral-600">
                {d.label}
                <input
                  value={editLabel}
                  onChange={(event) => setEditLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveLabel(editingPin.id);
                    } else if (event.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  maxLength={80}
                  autoFocus
                  placeholder={d.labelPlaceholder}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                />
              </label>
              {categoryOptions.length > 0 ? (
                <label className="block text-xs text-neutral-600">
                  {d.category}
                  <select
                    data-testid="pin-edit-category"
                    value={editCategory}
                    onChange={(event) => setEditCategory(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">{d.noCategory}</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value} title={option.description ?? undefined}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-xs text-neutral-600" data-testid="pin-edit-assign">
                {d.step2Title}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    assignRule.required ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {assignRule.required ? d.assignRequired : d.assignOptional}
                </span>
                <input
                  value={editAssign}
                  onChange={(event) => setEditAssign(event.target.value.toUpperCase())}
                  maxLength={30}
                  required={assignRule.required}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={d.assignPlaceholder}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm uppercase tracking-wide"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => saveLabel(editingPin.id)}
                  data-testid="pin-step-save"
                  className="rounded-full bg-violet-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                >
                  {d.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-[12px] font-semibold"
                >
                  {d.cancel}
                </button>
              </div>
            </div>
          ) : null}
          <PinFlowNav
            backLabel={d.back}
            onBack={() => setFlowScreen(2)}
            continueLabel={editingPin ? d.saveAndContinue : d.continue}
            continueDisabled={pending}
            onContinue={
              editingPin ? () => saveLabel(editingPin.id, true) : () => setFlowScreen(4)
            }
          />
        </section>
        ) : null}

        {flowScreen === 4 ? (
        <section data-testid="pin-step-5" className="space-y-3">
          <p className="text-[12px] leading-snug text-neutral-600">{d.step5Body}</p>
          {dashboard.pins.length === 0 ? (
            <p className="text-xs text-neutral-500">{d.noneYet}</p>
          ) : (
            <ul className="space-y-1.5">
              {dashboard.pins.map((pin, index) => (
                <li
                  key={pin.id}
                  className={`rounded-lg border px-2 py-1.5 ${
                    editingId === pin.id
                      ? "border-violet-300 bg-violet-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {pin.label.trim() || `PIN ${index + 2}`}
                      </span>
                      {editingId === pin.id ? (
                        <span className="mt-0.5 inline-block rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {d.editingNow}
                        </span>
                      ) : null}
                      {pin.createdByKind === "admin" || pin.createdByKind === "agent" ? (
                        <span
                          className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900"
                          data-testid="pin-placed-by-staff"
                        >
                          {pin.createdByKind === "admin" ? d.placedByAdmin : d.placedByAgent}
                        </span>
                      ) : null}
                      {pin.assignedFastCode ? (
                        <span
                          className="mt-0.5 mr-1 inline-block rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-900"
                          data-testid="pin-assigned-chip"
                        >
                          {fmt(d.assignedChip, { code: pin.assignedFastCode.toUpperCase() })}
                        </span>
                      ) : null}
                      {pin.category ? (
                        <span
                          className="mt-0.5 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-900"
                          data-testid="pin-category-chip"
                        >
                          {categoryOptions.find((option) => option.value === pin.category)?.label ??
                            pin.category.replace(/^custom:/, "")}
                        </span>
                      ) : null}
                      <span className="block font-mono text-[10px] text-neutral-500">
                        {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(pin.id)}
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px] font-semibold"
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
                            : "border-neutral-300 bg-white text-red-700"
                        }`}
                      >
                        {confirmDeleteId === pin.id ? d.confirmDelete : d.delete}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFlowScreen(3)}
              data-testid="pin-flow-back"
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {d.back}
            </button>
            <button
              type="button"
              onClick={goAddAnotherPin}
              data-testid="pin-flow-add-another"
              className="rounded-full bg-[#046BD9] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0358b3]"
            >
              {d.addAnotherPin}
            </button>
          </div>
        </section>
        ) : null}
      </div>
  );

  if (embedded) {
    return (
      <div role="region" aria-labelledby={titleId}>
        <div className="sr-only" id={titleId}>
          {d.title}
        </div>
        {body}
      </div>
    );
  }

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      className="pointer-events-auto absolute left-3 top-3 z-30 flex max-h-[min(calc(100%-1.5rem),44rem)] w-[min(calc(100%-1.5rem),22rem)] flex-col overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-xl ring-1 ring-black/5 sm:left-4 sm:top-4"
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
      {body}
    </section>
  );
}

/** True when the Add Pin form holds unsaved input worth resuming. */
export function pinDraftHasWork(
  draft: Partial<PinDraft> | null | undefined,
  options: { includeAssignment?: boolean } = {},
): boolean {
  if (!draft) return false;
  const includeAssignment = options.includeAssignment ?? true;
  return Boolean(
    draft.label?.trim() ||
      draft.latitude?.trim() ||
      draft.longitude?.trim() ||
      draft.editingId ||
      (includeAssignment && normalizeAssignedFastCode(draft.assignFastCode)),
  );
}
