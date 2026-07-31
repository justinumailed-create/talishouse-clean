import {
  TALISBOOKS_DOUBLE_IMAGE_COUNT,
  TALISBOOKS_GALLERY_MAX_IMAGES,
} from "./constants";
import type {
  TalisBooksClassifiedAsset,
  TalisBooksLayoutDecision,
  TalisBooksLayoutPlacement,
} from "./types";

function isGalleryCandidate(asset: TalisBooksClassifiedAsset): boolean {
  if (asset.mediaKind !== "image") {
    return false;
  }
  // Smaller / square tiles pack well into a gallery.
  return asset.orientation === "square" || asset.aspectRatio < 1.15;
}

function isCenterfoldHalf(asset: TalisBooksClassifiedAsset): boolean {
  return asset.role === "derived_left" || asset.role === "derived_right";
}

/**
 * Drop originals that already have derived left/right halves in the queue —
 * those halves become the centerfold spread instead.
 */
export function preferCenterfoldHalves(
  assets: TalisBooksClassifiedAsset[],
): TalisBooksClassifiedAsset[] {
  const parentsWithHalves = new Set(
    assets
      .filter(isCenterfoldHalf)
      .map((asset) => asset.parentImageId)
      .filter((id): id is string => Boolean(id)),
  );

  if (parentsWithHalves.size === 0) {
    return assets;
  }

  return assets.filter((asset) => {
    if (isCenterfoldHalf(asset)) {
      return true;
    }
    // Skip the preserved original when its halves are present.
    return !parentsWithHalves.has(asset.id);
  });
}

function centerfoldDecision(
  left: TalisBooksClassifiedAsset,
  right: TalisBooksClassifiedAsset,
): TalisBooksLayoutDecision {
  const caption = right.caption?.trim() || left.caption?.trim() || undefined;
  return {
    placement: "centerfold",
    assets: [
      { ...left, caption: undefined, hasCaption: false },
      { ...right, caption, hasCaption: Boolean(caption) },
    ],
    reason: "Joining landscape halves auto-arranged as a centerfold spread.",
  };
}

/**
 * Automatic placement decision for a single classified asset.
 * Users never choose placement — the engine does.
 */
export function decidePlacementForAsset(asset: TalisBooksClassifiedAsset): TalisBooksLayoutDecision {
  // Future media kinds: reserved placements until pipelines ship.
  if (asset.mediaKind === "floorplan") {
    return {
      placement: "centered",
      assets: [asset],
      reason: "Floorplans use centered containment until the floorplan renderer ships.",
    };
  }

  if (asset.mediaKind === "pdf") {
    return {
      placement: "single",
      assets: [asset],
      reason: "PDF pages use single-frame placement until the PDF pipeline ships.",
    };
  }

  if (asset.orientation === "panorama") {
    return {
      placement: "full_bleed",
      assets: [asset],
      reason: "Panorama images fill the page edge-to-edge.",
    };
  }

  if (asset.hasCaption) {
    return {
      placement: "caption",
      assets: [asset],
      reason: "Caption present — image + caption layout.",
    };
  }

  if (asset.orientation === "portrait") {
    return {
      placement: "centered",
      assets: [asset],
      reason: "Portrait images remain upright on a single page.",
    };
  }

  if (asset.orientation === "square") {
    return {
      placement: "centered",
      assets: [asset],
      reason: "Square images are centered on the page.",
    };
  }

  // Standard landscape (not panorama): full-bleed when unpaired.
  // Paired landscapes become double spreads; processed halves become centerfolds.
  return {
    placement: "full_bleed",
    assets: [asset],
    reason: "Unpaired landscape uses a full-bleed page (spreads use centerfold halves).",
  };
}

/**
 * Consumes a queue of classified assets and emits automatic layout decisions.
 * May pair/group assets into double, gallery, or centerfold placements.
 */
export function decidePlacements(
  assets: TalisBooksClassifiedAsset[],
): TalisBooksLayoutDecision[] {
  const decisions: TalisBooksLayoutDecision[] = [];
  const queue = [...preferCenterfoldHalves(assets)];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Always join derived left/right from the same upload into a centerfold.
    if (current.role === "derived_left") {
      const next = queue[0];
      if (
        next &&
        next.role === "derived_right" &&
        current.parentImageId &&
        next.parentImageId === current.parentImageId
      ) {
        queue.shift();
        decisions.push(centerfoldDecision(current, next));
        continue;
      }
    }

    // Prefer caption / panorama / future kinds as dedicated pages.
    if (
      current.hasCaption ||
      current.orientation === "panorama" ||
      current.mediaKind === "floorplan" ||
      current.mediaKind === "pdf"
    ) {
      decisions.push(decidePlacementForAsset(current));
      continue;
    }

    // Pack gallery candidates when several square/near-square tiles are waiting.
    if (isGalleryCandidate(current)) {
      const galleryGroup: TalisBooksClassifiedAsset[] = [current];
      while (galleryGroup.length < TALISBOOKS_GALLERY_MAX_IMAGES && queue.length > 0) {
        const next = queue[0];
        if (!next || !isGalleryCandidate(next) || next.hasCaption || isCenterfoldHalf(next)) {
          break;
        }
        galleryGroup.push(queue.shift()!);
      }

      if (galleryGroup.length >= 3) {
        decisions.push({
          placement: "gallery",
          assets: galleryGroup,
          reason: `Gallery of ${galleryGroup.length} related images.`,
        });
        continue;
      }

      // Not enough for gallery — fall through with re-queued leftovers handled via pair logic.
      if (galleryGroup.length === 2) {
        decisions.push({
          placement: "double",
          assets: galleryGroup,
          reason: "Two compatible images paired automatically.",
        });
        continue;
      }

      decisions.push(decidePlacementForAsset(galleryGroup[0]!));
      continue;
    }

    // Pair two compatible landscapes into a double spread.
    // Portraits are never paired — they remain upright single pages.
    const next = queue[0];
    if (
      next &&
      !next.hasCaption &&
      !isCenterfoldHalf(current) &&
      !isCenterfoldHalf(next) &&
      next.mediaKind === "image" &&
      current.mediaKind === "image" &&
      current.orientation === "landscape" &&
      next.orientation === "landscape"
    ) {
      const pair = [current, queue.shift()!];
      if (pair.length === TALISBOOKS_DOUBLE_IMAGE_COUNT) {
        decisions.push({
          placement: "double",
          assets: pair,
          reason: "Two landscape images paired into a spread.",
        });
        continue;
      }
    }

    decisions.push(decidePlacementForAsset(current));
  }

  return decisions;
}

export function emptyPlacementCounts(): Record<TalisBooksLayoutPlacement, number> {
  return {
    single: 0,
    double: 0,
    full_bleed: 0,
    centered: 0,
    caption: 0,
    gallery: 0,
    centerfold: 0,
  };
}
