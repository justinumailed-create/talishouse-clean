export interface MapSiteGalleryItem {
  url: string;
  description: string;
  sortOrder: number;
  visible: boolean;
}

export interface MapSiteGalleryDisplayItem {
  url: string;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function galleryItemsFromLegacyUrls(urls: string[]): MapSiteGalleryItem[] {
  return urls
    .filter((url) => url.trim().length > 0)
    .map((url, index) => ({
      url: url.trim(),
      description: "",
      sortOrder: index,
      visible: true,
    }));
}

export function parseGalleryItems(raw: unknown): MapSiteGalleryItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: MapSiteGalleryItem[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const url = typeof entry.url === "string" ? entry.url.trim() : "";
    if (!url) continue;

    items.push({
      url,
      description:
        typeof entry.description === "string" ? entry.description.trim() : "",
      sortOrder:
        typeof entry.sortOrder === "number" && Number.isFinite(entry.sortOrder)
          ? entry.sortOrder
          : items.length,
      visible: entry.visible !== false,
    });
  }

  return orderGalleryItemsBySortOrder(items);
}

export function mergeGalleryItemsWithLegacy(
  items: MapSiteGalleryItem[],
  legacyUrls: string[]
): MapSiteGalleryItem[] {
  const legacy = galleryItemsFromLegacyUrls(legacyUrls);
  if (legacy.length <= items.length) {
    return items;
  }

  const knownUrls = new Set(items.map((item) => item.url));
  const extras = legacy.filter((item) => !knownUrls.has(item.url));
  if (extras.length === 0) {
    return items;
  }

  return orderGalleryItemsBySortOrder([
    ...items,
    ...extras.map((item, index) => ({
      ...item,
      sortOrder: items.length + index,
    })),
  ]);
}

export function resolveMapSiteGalleryItems(
  galleryItems: unknown,
  legacyUrls: string[]
): MapSiteGalleryItem[] {
  const parsed = parseGalleryItems(galleryItems);
  if (parsed.length > 0) {
    return mergeGalleryItemsWithLegacy(parsed, legacyUrls);
  }
  return galleryItemsFromLegacyUrls(legacyUrls);
}

export function orderGalleryItemsBySortOrder(
  items: MapSiteGalleryItem[]
): MapSiteGalleryItem[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
}

export function normalizeGalleryItemsForSave(
  items: MapSiteGalleryItem[]
): MapSiteGalleryItem[] {
  return items.map((item, index) => ({
    url: item.url.trim(),
    description: item.description.trim(),
    sortOrder: index,
    visible: item.visible,
  }));
}

export function galleryItemsToLegacyUrls(items: MapSiteGalleryItem[]): string[] {
  return normalizeGalleryItemsForSave(items)
    .filter((item) => item.visible)
    .map((item) => item.url);
}

export function toDisplayGalleryUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes("imgThumb-")) {
    return trimmed.replace("imgThumb-", "img-");
  }

  if (trimmed.includes("images.unsplash.com")) {
    return trimmed
      .replace(/w=\d+/i, "w=1600")
      .replace(/h=\d+/i, "h=1200");
  }

  return trimmed;
}

export function visibleGalleryDisplayItems(
  items: MapSiteGalleryItem[]
): MapSiteGalleryDisplayItem[] {
  return normalizeGalleryItemsForSave(items)
    .filter((item) => item.visible)
    .map((item) => ({
      url: toDisplayGalleryUrl(item.url),
      description: item.description,
    }));
}
