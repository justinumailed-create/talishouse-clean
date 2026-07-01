export const DEFAULT_MAPSITE_ATLIST_MAP_URL =
  "https://my.atlist.com/map/dd00462f-d929-4aac-a777-32017c2523b1?share=true";

export function resolveMapsiteAtlistMapUrl(
  storedUrl: string | null | undefined
): string {
  const trimmed = storedUrl?.trim();
  return trimmed || DEFAULT_MAPSITE_ATLIST_MAP_URL;
}
