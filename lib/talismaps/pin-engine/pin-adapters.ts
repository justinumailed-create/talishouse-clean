import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import { PIN_KIND_CONFIG } from "./constants";
import type { TalisMapsPinRecord } from "./types";

export function pinRecordToMapEnginePin(pin: TalisMapsPinRecord): MapEnginePin {
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    label: pin.name,
    color: pin.categoryColor || PIN_KIND_CONFIG[pin.pinType].color,
    featured: pin.featured || pin.pinType === "property",
    metadata: {
      icon: "dot",
      whiteCenter: true,
      pinType: pin.pinType,
      status: pin.status,
      visibility: pin.visibility,
    },
  };
}

export function pinRecordsToMapEnginePins(pins: TalisMapsPinRecord[]): MapEnginePin[] {
  return pins.map(pinRecordToMapEnginePin);
}
