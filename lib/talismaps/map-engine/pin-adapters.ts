import type { TalisMapsPin } from "@/lib/talismaps";
import type { MapEnginePin } from "./types";

const DEFAULT_PIN_COLOR = "#1C1C1E";

export function toMapEnginePin(pin: TalisMapsPin): MapEnginePin {
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    label: pin.name,
    color: pin.categoryColor || DEFAULT_PIN_COLOR,
    featured: pin.featured,
    metadata: {
      icon: "dot",
      whiteCenter: true,
      categorySlug: pin.categorySlug,
      address: pin.address,
      city: pin.city,
    },
  };
}

export function toMapEnginePins(pins: TalisMapsPin[]): MapEnginePin[] {
  return pins.map(toMapEnginePin);
}
