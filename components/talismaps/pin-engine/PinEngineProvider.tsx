"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapViewport } from "@/lib/talismaps/map-engine";
import { useTalisMapsMapDefaults } from "@/lib/talismaps/use-map-defaults";
import { pinRecordsToMapEnginePins } from "@/lib/talismaps/pin-engine";
import type {
  PinSaveState,
  TalisMapsEditorBootstrap,
  TalisMapsPinKind,
  TalisMapsPinRecord,
  UpdateTalisMapsPinInput,
} from "@/lib/talismaps/pin-engine";

const AUTO_SAVE_DELAY_MS = 450;

interface PinEngineContextValue {
  isLoading: boolean;
  map: TalisMapsEditorBootstrap["map"] | null;
  categories: TalisMapsEditorBootstrap["categories"];
  pins: TalisMapsPinRecord[];
  selectedPin: TalisMapsPinRecord | null;
  selectedPinId: string | null;
  saveState: PinSaveState;
  setSelectedPinId: (pinId: string | null) => void;
  createPin: (pinType: TalisMapsPinKind) => Promise<void>;
  updatePin: (pinId: string, patch: UpdateTalisMapsPinInput) => void;
  deletePin: (pinId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PinEngineContext = createContext<PinEngineContextValue | null>(null);

export function PinEngineProvider({ children }: { children: ReactNode }) {
  const defaults = useTalisMapsMapDefaults();
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<TalisMapsEditorBootstrap | null>(null);
  const [pins, setPins] = useState<TalisMapsPinRecord[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<PinSaveState>("idle");
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const refresh = useCallback(async () => {
    const response = await fetch("/api/talismaps/editor/bootstrap");
    if (!response.ok) {
      throw new Error("Failed to load Talismaps™ editor");
    }
    const data = (await response.json()) as TalisMapsEditorBootstrap;
    setBootstrap(data);
    setPins(data.pins);
  }, []);

  useEffect(() => {
    refresh()
      .catch((error) => {
        console.error("[PinEngineProvider]", error);
        setBootstrap(null);
        setPins([]);
      })
      .finally(() => setIsLoading(false));
  }, [refresh]);

  const persistPin = useCallback(
    async (pinId: string, patch: UpdateTalisMapsPinInput) => {
      if (!bootstrap?.map.id) return;

      setSaveState("saving");
      try {
        const response = await fetch(
          `/api/talismaps/maps/${bootstrap.map.id}/pins/${pinId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }
        );

        if (!response.ok) {
          throw new Error("Auto-save failed");
        }

        const data = (await response.json()) as { pin: TalisMapsPinRecord };
        setPins((current) =>
          current.map((pin) => (pin.id === data.pin.id ? data.pin : pin))
        );
        setSaveState("saved");
      } catch (error) {
        console.error("[PinEngineProvider] auto-save failed:", error);
        setSaveState("error");
      }
    },
    [bootstrap?.map.id]
  );

  const updatePin = useCallback(
    (pinId: string, patch: UpdateTalisMapsPinInput) => {
      setPins((current) =>
        current.map((pin) => {
          if (pin.id !== pinId) return pin;

          const nextMedia = patch.media
            ? patch.media.map((item, index) => ({
                id: item.id ?? `temp-${index}`,
                pinId: pin.id,
                mediaType: item.mediaType ?? "image",
                url: item.url,
                altText: item.altText ?? "",
                caption: item.caption ?? "",
                sortOrder: item.sortOrder ?? index,
                isPrimary: item.isPrimary ?? index === 0,
              }))
            : pin.media;

          return {
            ...pin,
            ...patch,
            latitude: patch.latitude ?? pin.latitude,
            longitude: patch.longitude ?? pin.longitude,
            media: nextMedia,
          };
        })
      );

      const existingTimer = saveTimersRef.current.get(pinId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        void persistPin(pinId, patch);
        saveTimersRef.current.delete(pinId);
      }, AUTO_SAVE_DELAY_MS);

      saveTimersRef.current.set(pinId, timer);
    },
    [persistPin]
  );

  const createPin = useCallback(
    async (pinType: TalisMapsPinKind) => {
      if (!bootstrap?.map.id) return;

      setSaveState("saving");
      const viewportCenter = bootstrap.map.defaultLatitude
        ? {
            latitude: bootstrap.map.defaultLatitude,
            longitude: bootstrap.map.defaultLongitude ?? -79.3832,
          }
        : { latitude: 43.6532, longitude: -79.3832 };

      const response = await fetch(`/api/talismaps/maps/${bootstrap.map.id}/pins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinType,
          latitude: viewportCenter.latitude,
          longitude: viewportCenter.longitude,
        }),
      });

      if (!response.ok) {
        setSaveState("error");
        return;
      }

      const data = (await response.json()) as { pin: TalisMapsPinRecord };
      setPins((current) => [...current, data.pin]);
      setSelectedPinId(data.pin.id);
      setSaveState("saved");
    },
    [bootstrap?.map]
  );

  const deletePin = useCallback(
    async (pinId: string) => {
      if (!bootstrap?.map.id) return;

      const response = await fetch(
        `/api/talismaps/maps/${bootstrap.map.id}/pins/${pinId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        setSaveState("error");
        return;
      }

      setPins((current) => current.filter((pin) => pin.id !== pinId));
      setSelectedPinId((current) => (current === pinId ? null : current));
      setSaveState("saved");
    },
    [bootstrap?.map.id]
  );

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId) ?? null,
    [pins, selectedPinId]
  );

  const enginePins = useMemo(() => pinRecordsToMapEnginePins(pins), [pins]);
  const draggablePinIds = useMemo(() => pins.map((pin) => pin.id), [pins]);

  const initialViewport = useMemo<MapViewport>(
    () => ({
      center: {
        latitude: bootstrap?.map.defaultLatitude ?? 43.6532,
        longitude: bootstrap?.map.defaultLongitude ?? -79.3832,
      },
      zoom: bootstrap?.map.defaultZoom ?? 11,
    }),
    [bootstrap?.map]
  );

  const handlePinDrag = useCallback(
    (pinId: string, coordinates: MapViewport["center"]) => {
      updatePin(pinId, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
    },
    [updatePin]
  );

  const value = useMemo(
    () => ({
      isLoading,
      map: bootstrap?.map ?? null,
      categories: bootstrap?.categories ?? [],
      pins,
      selectedPin,
      selectedPinId,
      saveState,
      setSelectedPinId,
      createPin,
      updatePin,
      deletePin,
      refresh,
    }),
    [
      isLoading,
      bootstrap,
      pins,
      selectedPin,
      selectedPinId,
      saveState,
      createPin,
      updatePin,
      deletePin,
      refresh,
    ]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f7] text-sm text-neutral-500">
        Loading Talismaps™ PIN Engine…
      </div>
    );
  }

  return (
    <PinEngineContext.Provider value={value}>
      <MapEngineProvider
        providerId={defaults.providerId}
        basemapView={defaults.basemapView}
        initialPins={enginePins}
        initialViewport={initialViewport}
        selectedPinId={selectedPinId}
        draggablePinIds={draggablePinIds}
        onPinSelect={setSelectedPinId}
        onPinDrag={handlePinDrag}
      >
        {children}
      </MapEngineProvider>
    </PinEngineContext.Provider>
  );
}

export function usePinEngine(): PinEngineContextValue {
  const context = useContext(PinEngineContext);
  if (!context) {
    throw new Error("usePinEngine must be used within PinEngineProvider");
  }
  return context;
}
