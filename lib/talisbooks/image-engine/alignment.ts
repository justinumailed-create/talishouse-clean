import type { TalisBooksImageDimensions } from "./types";
import type { TalisBooksCenterfoldAlignment } from "./types";

/**
 * Verifies that derived left/right halves maintain perfect alignment
 * with the unbroken original — no permanent crop of the source.
 */
export function verifyCenterfoldAlignment(input: {
  original: TalisBooksImageDimensions;
  left: TalisBooksImageDimensions;
  right: TalisBooksImageDimensions;
}): TalisBooksCenterfoldAlignment {
  const { original, left, right } = input;

  const heightMatched =
    left.height === original.height &&
    right.height === original.height &&
    left.height === right.height;

  const widthPreserved = left.width + right.width === original.width;
  const seamAligned = widthPreserved && heightMatched;

  return {
    aligned: seamAligned && widthPreserved && heightMatched,
    originalWidth: original.width,
    originalHeight: original.height,
    leftWidth: left.width,
    rightWidth: right.width,
    leftHeight: left.height,
    rightHeight: right.height,
    seamAligned,
    heightMatched,
    widthPreserved,
  };
}
