import type { TalisMapsPin } from "@/lib/talismaps";
import type { MapEnginePin } from "./types";

const DEFAULT_PIN_COLOR = "#1C1C1E";

export function toMapEnginePin(pin: TalisMapsPin): MapEnginePin {
  const icon = pin.pinIcon?.trim() || "dot";
  const color = pin.pinColor?.trim() || pin.categoryColor || DEFAULT_PIN_COLOR;
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    label: pin.name,
    color,
    featured: pin.featured,
    metadata: {
      icon,
      whiteCenter: pin.whiteCenter ?? true,
      categorySlug: pin.categorySlug,
      address: pin.address,
      city: pin.city,
      href: pin.href?.trim() || null,
      categoryBadge: pin.categoryBadge?.trim() || null,
    },
  };
}

export function toMapEnginePins(pins: TalisMapsPin[]): MapEnginePin[] {
  return pins.map(toMapEnginePin);
}
