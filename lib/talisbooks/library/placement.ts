/**
 * Authoritative bookshelf placement.
 *
 * Physical position lives on the book, in `metadata.bookshelfPlacement`
 * (existing `talisbooks_books.metadata` JSONB — no extra column).
 *
 *   { shelf: 1 | 2, row: number, position: number }
 *
 * shelf 1 = left / hero niche
 * shelf 2 = main shelf
 * row and position are 1-based; position 1 is the left end of that row.
 *
 * Date and Name sorting reorder only books that have no placement.
 * A stored placement is never rewritten by sort, title, cover, or date.
 */

export const BOOKSHELF_PLACEMENT_METADATA_KEY = "bookshelfPlacement";

export type BookshelfPlacement = {
  shelf: 1 | 2;
  row: number;
  position: number;
};

type Placeable = {
  shelfPlacement?: unknown;
  metadata?: Record<string, unknown> | null;
};

function asPlacement(value: unknown): BookshelfPlacement | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const shelf = Number(record.shelf);
  const row = Number(record.row);
  const position = Number(record.position);
  if (shelf !== 1 && shelf !== 2) return null;
  if (!Number.isInteger(row) || row < 1) return null;
  if (!Number.isInteger(position) || position < 1) return null;
  return { shelf: shelf as 1 | 2, row, position };
}

export function readBookshelfPlacement(book: Placeable): BookshelfPlacement | null {
  const direct = asPlacement(book.shelfPlacement);
  if (direct) return direct;
  return asPlacement(book.metadata?.[BOOKSHELF_PLACEMENT_METADATA_KEY]);
}

/** Merge placement into metadata without dropping other keys. */
export function withBookshelfPlacement(
  metadata: Record<string, unknown> | null | undefined,
  placement: BookshelfPlacement,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [BOOKSHELF_PLACEMENT_METADATA_KEY]: placement,
  };
}

/** Keep a previously stored placement when a regenerate replaces metadata. */
export function preserveBookshelfPlacement(
  previous: Record<string, unknown> | null | undefined,
  next: Record<string, unknown>,
): Record<string, unknown> {
  const placement = asPlacement(previous?.[BOOKSHELF_PLACEMENT_METADATA_KEY]);
  if (!placement) return next;
  if (asPlacement(next[BOOKSHELF_PLACEMENT_METADATA_KEY])) return next;
  return withBookshelfPlacement(next, placement);
}

/**
 * Place anchored books on a fixed niche grid, then fill open slots with
 * `flexibleInOrder`. Trailing empty slots are dropped; gaps before an
 * anchored book are kept so position stays left-aligned.
 */
export function layoutNicheRows<T extends Placeable>(
  flexibleInOrder: T[],
  anchored: T[],
  shelf: 1 | 2,
  rowWidths: number[],
): { rows: Array<Array<T | null>>; overflow: T[] } {
  const slots: Array<Array<T | null>> = rowWidths.map((width) =>
    Array.from({ length: width }, () => null),
  );
  const overflow: T[] = [];

  for (const book of anchored) {
    const placement = readBookshelfPlacement(book);
    if (!placement || placement.shelf !== shelf) {
      overflow.push(book);
      continue;
    }
    const rowIndex = placement.row - 1;
    const columnIndex = placement.position - 1;
    const row = slots[rowIndex];
    if (!row || columnIndex < 0 || columnIndex >= row.length || row[columnIndex]) {
      overflow.push(book);
      continue;
    }
    row[columnIndex] = book;
  }

  const fill = [...overflow, ...flexibleInOrder];
  let fillIndex = 0;
  for (const row of slots) {
    for (let index = 0; index < row.length; index += 1) {
      if (row[index]) continue;
      const next = fill[fillIndex];
      if (!next) break;
      row[index] = next;
      fillIndex += 1;
    }
  }

  const trimmed = slots.map((row) => {
    let end = row.length;
    while (end > 0 && row[end - 1] == null) end -= 1;
    return row.slice(0, end);
  });
  const overflowBooks = fill.slice(fillIndex);
  if (!trimmed.some((row) => row.some((book) => book != null))) {
    return { rows: [], overflow: overflowBooks };
  }
  return { rows: trimmed, overflow: overflowBooks };
}

/**
 * Main shelf. `flexibleInOrder` is the current temporary sort (Date / Name)
 * of books with no placement. Anchored books occupy shelf 2 row/position
 * and are not shifted by that sort.
 */
export function layoutMainShelfRows<T extends Placeable>(
  flexibleInOrder: T[],
  anchored: T[],
  columns: number,
): Array<Array<T | null>> {
  const width = Math.max(1, columns);
  const anchorsBySlot = new Map<string, T>();
  const rejected: T[] = [];
  let maxRow = 0;

  for (const book of anchored) {
    const placement = readBookshelfPlacement(book);
    if (!placement || placement.shelf !== 2 || placement.position > width) {
      rejected.push(book);
      continue;
    }
    const key = `${placement.row}:${placement.position}`;
    if (anchorsBySlot.has(key)) {
      rejected.push(book);
      continue;
    }
    anchorsBySlot.set(key, book);
    maxRow = Math.max(maxRow, placement.row);
  }

  const fill = [...rejected, ...flexibleInOrder];
  const neededRows = Math.max(
    maxRow,
    Math.ceil((fill.length + anchorsBySlot.size) / width),
  );
  if (neededRows === 0) return [];

  const rows: Array<Array<T | null>> = [];
  let fillIndex = 0;
  for (let row = 1; row <= neededRows; row += 1) {
    const line: Array<T | null> = [];
    for (let position = 1; position <= width; position += 1) {
      const anchoredBook = anchorsBySlot.get(`${row}:${position}`);
      if (anchoredBook) {
        line.push(anchoredBook);
        continue;
      }
      const next = fill[fillIndex];
      if (next) {
        line.push(next);
        fillIndex += 1;
      } else if (row <= maxRow) {
        line.push(null);
      }
    }
    while (line.length > 0 && line[line.length - 1] == null) line.pop();
    if (line.some((book) => book != null)) rows.push(line);
    if (fillIndex >= fill.length && row >= maxRow) break;
  }
  return rows;
}
