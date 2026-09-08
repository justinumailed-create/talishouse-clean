export interface PixelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Selfie models mark the person as non-zero; invert if the mask is mostly filled. */
export function normalizePersonMask(mask: Uint8Array): Uint8Array {
  if (mask.length === 0) return mask;
  let lit = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if ((mask[i] ?? 0) > 0) lit += 1;
  }
  if (lit / mask.length <= 0.65) return mask;

  const inverted = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i += 1) {
    inverted[i] = (mask[i] ?? 0) > 0 ? 0 : 255;
  }
  return inverted;
}

export function personBoundingBox(
  mask: Uint8Array,
  width: number,
  height: number,
  threshold = 0,
): PixelBox | null {
  if (width <= 0 || height <= 0 || mask.length < width * height) return null;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if ((mask[row + x] ?? 0) <= threshold) continue;
      count += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const area = width * height;
  if (count < Math.max(24, area * 0.004) || maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function zoomedCropRect(
  box: PixelBox,
  imageWidth: number,
  imageHeight: number,
  options: { padding?: number; zoom?: number } = {},
): PixelBox {
  const padding = options.padding ?? 0.1;
  const zoom = options.zoom ?? 1.28;
  const pad = Math.round(Math.max(box.width, box.height) * padding);

  let width = box.width + pad * 2;
  let height = box.height + pad * 2.15;
  let x = box.x - pad;
  let y = box.y - Math.round(pad * 1.2);

  const nextWidth = width / zoom;
  const nextHeight = height / zoom;
  const focusX = x + width / 2;
  const focusY = y + height * 0.36;
  x = focusX - nextWidth / 2;
  y = focusY - nextHeight / 2;
  width = nextWidth;
  height = nextHeight;

  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > imageWidth) width = imageWidth - x;
  if (y + height > imageHeight) height = imageHeight - y;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}
