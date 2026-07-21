import {
  aspectRatio,
  detectImageOrientation,
} from "../image-engine/orientation";
import type { TalisBooksClassifiedAsset, TalisBooksLayoutImageRef, TalisBooksMediaKind } from "./types";

function resolveMediaKind(kind: TalisBooksMediaKind | undefined): TalisBooksMediaKind {
  return kind ?? "image";
}

/**
 * Classifies an uploaded asset for automatic placement.
 * Landscape / Portrait / Panorama / Square are derived from dimensions.
 */
export function classifyLayoutAsset(input: TalisBooksLayoutImageRef): TalisBooksClassifiedAsset {
  const dimensions = { width: input.width, height: input.height };
  const orientation = detectImageOrientation(dimensions);
  const caption = input.caption?.trim() ?? "";

  return {
    ...input,
    orientation,
    aspectRatio: aspectRatio(dimensions),
    mediaKind: resolveMediaKind(input.mediaKind),
    hasCaption: caption.length > 0,
    caption: caption || undefined,
  };
}

export function classifyLayoutAssets(
  inputs: TalisBooksLayoutImageRef[],
): TalisBooksClassifiedAsset[] {
  return inputs.map(classifyLayoutAsset);
}
