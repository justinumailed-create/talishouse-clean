import type { TalisBooksViewerBook, TalisBooksViewerPage } from "./types";

/**
 * Page art is painted as a CSS `background-image`, so the browser only starts
 * fetching once a face mounts — mid page-turn. Warming the bitmaps up front
 * keeps them in the memory cache so a turn paints in the same frame.
 */

/** Held for the session: dropping the element lets the decoded bitmap be evicted. */
const warmed = new Map<string, HTMLImageElement>();

/** Phones choke when a whole book is requested at once. */
const MAX_PARALLEL_WARMUPS = 3;

let queue: string[] = [];
let active = 0;

function pump() {
  while (active < MAX_PARALLEL_WARMUPS) {
    const url = queue.shift();
    if (!url) return;
    if (warmed.has(url)) continue;

    const image = new Image();
    warmed.set(url, image);
    active += 1;

    const release = () => {
      active -= 1;
      pump();
    };
    image.onload = release;
    image.onerror = () => {
      warmed.delete(url);
      release();
    };
    image.decoding = "async";
    image.src = url;
  }
}

/**
 * Queue images for background download, nearest first. Re-calling with a new
 * order re-prioritises whatever has not started yet.
 */
export function warmViewerImages(urls: readonly string[]) {
  if (typeof window === "undefined") return;

  const pending = urls.filter((url) => url && !warmed.has(url));
  if (pending.length === 0) return;

  const promoted = new Set(pending);
  queue = [...pending, ...queue.filter((url) => !promoted.has(url))];
  pump();
}

export function isViewerImageWarm(url: string | undefined): boolean {
  if (!url) return true;
  return warmed.get(url)?.complete ?? false;
}

function pageImageUrls(page: TalisBooksViewerPage | null | undefined): string[] {
  if (!page) return [];
  return [
    page.spreadImageUrl,
    page.heroImageUrl,
    page.agentPhotoUrl,
    page.brokerageLogoUrl,
  ].filter((url): url is string => Boolean(url));
}

/**
 * Every image the book can paint, ordered outward from `activeIndex` so the
 * next turn is always the next thing downloaded.
 */
export function orderedViewerImageUrls(
  book: TalisBooksViewerBook,
  activePageIndex: number,
): string[] {
  const byDistance = [...book.pages.keys()].sort(
    (a, b) => Math.abs(a - activePageIndex) - Math.abs(b - activePageIndex),
  );

  const urls = [
    ...pageImageUrls(book.pages[activePageIndex]),
    book.frontCoverImageUrl,
    book.backCoverImageUrl,
    ...byDistance.flatMap((index) => pageImageUrls(book.pages[index])),
  ].filter((url): url is string => Boolean(url));

  return [...new Set(urls)];
}
