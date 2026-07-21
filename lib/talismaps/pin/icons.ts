/** Compact SVG path glyphs for the white-center PIN icon. ViewBox 0 0 24 24. */

export const TALISMAPS_PIN_ICON_PATHS: Record<string, string> = {
  dot: "",
  home: "M12 4 L4 11 V19 H9 V14 H15 V19 H20 V11 Z",
  star: "M12 3 L14.5 9 H21 L16 13 L18 20 L12 16 L6 20 L8 13 L3 9 H9.5 Z",
  building:
    "M6 8 H18 V20 H6 Z M9 11 H11 V13 H9 Z M13 11 H15 V13 H13 Z M9 15 H11 V17 H9 Z M13 15 H15 V17 H13 Z",
  "map-pin":
    "M12 3 C8.5 3 6 5.8 6 9 C6 13 12 20 12 20 C12 20 18 13 18 9 C18 5.8 15.5 3 12 3 Z M12 11.2 C10.7 11.2 9.8 10.3 9.8 9 C9.8 7.7 10.7 6.8 12 6.8 C13.3 6.8 14.2 7.7 14.2 9 C14.2 10.3 13.3 11.2 12 11.2 Z",
  landmark: "M12 4 L16 20 H8 Z M7 20 H17",
};

export function getPinIconPath(icon: string): string {
  return TALISMAPS_PIN_ICON_PATHS[icon] ?? TALISMAPS_PIN_ICON_PATHS.dot;
}
