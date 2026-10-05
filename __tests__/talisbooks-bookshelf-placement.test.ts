import { describe, expect, it } from "vitest";
import {
  layoutMainShelfRows,
  layoutNicheRows,
  preserveBookshelfPlacement,
  readBookshelfPlacement,
  withBookshelfPlacement,
} from "../lib/talisbooks/library/placement";

type Book = {
  id: string;
  metadata?: Record<string, unknown> | null;
  shelfPlacement?: { shelf: 1 | 2; row: number; position: number } | null;
};

function book(id: string, placement?: Book["shelfPlacement"]): Book {
  return placement
    ? { id, metadata: withBookshelfPlacement({}, placement), shelfPlacement: placement }
    : { id };
}

describe("bookshelf placement", () => {
  it("reads shelf, row, and position from book metadata", () => {
    const placed = book("yellow", { shelf: 2, row: 2, position: 1 });
    expect(readBookshelfPlacement(placed)).toEqual({
      shelf: 2,
      row: 2,
      position: 1,
    });
    expect(readBookshelfPlacement({ id: "plain" })).toBeNull();
  });

  it("keeps a stored placement when generation replaces metadata", () => {
    const previous = withBookshelfPlacement(
      { isolatedBookshelf: true, coverImageUrl: "/old.jpg" },
      { shelf: 2, row: 2, position: 1 },
    );
    const next = preserveBookshelfPlacement(previous, {
      coverImageUrl: "/new.jpg",
      isolatedBookshelf: true,
    });
    expect(next.coverImageUrl).toBe("/new.jpg");
    expect(next.bookshelfPlacement).toEqual({ shelf: 2, row: 2, position: 1 });
  });

  it("puts an anchored book on main-shelf row 2 position 1 without shifting it for later books", () => {
    const yellow = book("yellow", { shelf: 2, row: 2, position: 1 });
    const others = ["a", "b", "c"].map((id) => book(id));
    const rows = layoutMainShelfRows(others, [yellow], 10);
    expect(rows[0]?.map((item) => item?.id)).toEqual(["a", "b", "c"]);
    expect(rows[1]?.[0]?.id).toBe("yellow");
  });

  it("does not let a title sort move an anchored book", () => {
    const yellow = book("yellow", { shelf: 2, row: 2, position: 1 });
    const sortedByName = [book("alpha"), book("mango"), book("zebra")];
    const rows = layoutMainShelfRows(sortedByName, [yellow], 10);
    expect(rows[1]?.[0]?.id).toBe("yellow");
    expect(rows[0]?.map((item) => item?.id)).toEqual(["alpha", "mango", "zebra"]);
  });

  it("sends the 11th unplaced book to the next open slot after an anchor", () => {
    const yellow = book("yellow", { shelf: 2, row: 2, position: 1 });
    const flexible = Array.from({ length: 11 }, (_, index) => book(`b${index + 1}`));
    const rows = layoutMainShelfRows(flexible, [yellow], 10);
    expect(rows[0]).toHaveLength(10);
    expect(rows[1]?.[0]?.id).toBe("yellow");
    expect(rows[1]?.[1]?.id).toBe("b11");
  });

  it("places a left-niche book on row 2 position 1 without taking the hero slot", () => {
    const hero = book("hero");
    const second = book("second");
    const yellow = book("yellow", { shelf: 1, row: 2, position: 1 });
    const { rows } = layoutNicheRows([hero, second], [yellow], 1, [1, 2, 2]);
    expect(rows[0]?.[0]?.id).toBe("hero");
    expect(rows[1]?.[0]?.id).toBe("yellow");
    expect(rows[1]?.[1]?.id).toBe("second");
  });
});
