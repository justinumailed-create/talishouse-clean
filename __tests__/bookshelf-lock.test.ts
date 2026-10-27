import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  BOOKSHELF_REGISTER_PATH,
  LOCKED_SHELF_COLUMNS,
  LOCKED_SHELF_DUMMY_COUNT,
  LOCKED_SHELF_ROWS,
  connectedBookshelfPath,
  normalizeBookshelfFastCodeInput,
} from "../lib/talisbooks/bookshelf/lock";

const mocks = vi.hoisted(() => ({
  getMapSiteByFastCode: vi.fn(),
  hasPaid: vi.fn(),
  paidSession: vi.fn(),
  ownerSession: vi.fn(),
}));

vi.mock("@/lib/mapsite-service", () => ({ getMapSiteByFastCode: mocks.getMapSiteByFastCode }));
vi.mock("@/lib/talispros/mapsite-payment", () => ({
  hasCompletedMapSiteActivationPayment: mocks.hasPaid,
}));
vi.mock("@/lib/mapsite-edit-auth", () => ({
  establishPaidMapSiteBrowserSession: mocks.paidSession,
  setMapSiteOwnerSession: mocks.ownerSession,
}));

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("locked catalogue bookshelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalises FAST Code input case-insensitively and rejects bad input", () => {
    expect(normalizeBookshelfFastCodeInput("  AbC12 ")).toEqual({ ok: true, code: "abc12" });
    expect(normalizeBookshelfFastCodeInput("")).toEqual({ ok: false, reason: "empty" });
    expect(normalizeBookshelfFastCodeInput("ab&c")).toEqual({ ok: false, reason: "format" });
    expect(connectedBookshelfPath("XyZ9")).toBe("/talisbooks/fast/xyz9");
    expect(BOOKSHELF_REGISTER_PATH).toBe("/talisu/reg");
    expect(LOCKED_SHELF_DUMMY_COUNT).toBe(LOCKED_SHELF_ROWS * LOCKED_SHELF_COLUMNS);
    expect(LOCKED_SHELF_ROWS).toBeGreaterThanOrEqual(3);
    expect(LOCKED_SHELF_ROWS).toBeLessThanOrEqual(4);
  });

  it("opens a valid code's connected bookshelf with the paid session when registered", async () => {
    const { openConnectedBookshelfFromFastCode } = await import("../app/talisbooks/fast/actions");
    mocks.getMapSiteByFastCode.mockResolvedValue({ id: "m1", fastCode: "test1" });
    mocks.hasPaid.mockResolvedValue(true);
    const result = await openConnectedBookshelfFromFastCode("TEST1");
    expect(mocks.getMapSiteByFastCode).toHaveBeenCalledWith("test1");
    expect(result).toEqual({ success: true, href: "/talisbooks/fast/test1" });
    expect(mocks.paidSession).toHaveBeenCalledWith("test1");
    expect(mocks.ownerSession).not.toHaveBeenCalled();
  });

  it("unregistered codes get only the owner session (no paid tools)", async () => {
    const { openConnectedBookshelfFromFastCode } = await import("../app/talisbooks/fast/actions");
    mocks.getMapSiteByFastCode.mockResolvedValue({ id: "m2", fastCode: "test2" });
    mocks.hasPaid.mockResolvedValue(false);
    const result = await openConnectedBookshelfFromFastCode("test2");
    expect(result).toEqual({ success: true, href: "/talisbooks/fast/test2" });
    expect(mocks.ownerSession).toHaveBeenCalledWith("test2");
    expect(mocks.paidSession).not.toHaveBeenCalled();
  });

  it("returns a generic not-found error for unknown codes without leaking codes", async () => {
    const { openConnectedBookshelfFromFastCode } = await import("../app/talisbooks/fast/actions");
    mocks.getMapSiteByFastCode.mockResolvedValue(null);
    const result = await openConnectedBookshelfFromFastCode("nope999");
    expect(result).toEqual({ success: false, error: "notFound" });
    expect(JSON.stringify(result)).not.toMatch(/nope999/i);
    expect(await openConnectedBookshelfFromFastCode("")).toEqual({ success: false, error: "empty" });
    expect(await openConnectedBookshelfFromFastCode("a b")).toEqual({ success: false, error: "format" });
    expect(mocks.ownerSession).not.toHaveBeenCalled();
    expect(mocks.paidSession).not.toHaveBeenCalled();
  });

  it("keeps ALLPINS on its own connected shelf", async () => {
    const { openConnectedBookshelfFromFastCode } = await import("../app/talisbooks/fast/actions");
    const result = await openConnectedBookshelfFromFastCode("ALLPINS");
    expect(result).toEqual({ success: true, href: "/talisbooks/fast/allpins" });
    expect(mocks.getMapSiteByFastCode).not.toHaveBeenCalled();
  });

  it("has EN and DE copy for the lock", () => {
    expect(en.bookshelf.lock.register).toBe("Register to Unlock Bookshelf");
    expect(de.bookshelf.lock.register).toBe("Registrieren, um das Bücherregal freizuschalten");
    expect(en.bookshelf.lock.haveCode).toBe("Already have a FAST Code?");
    expect(de.bookshelf.lock.haveCode).toBe("Haben Sie bereits einen FAST Code?");
    expect(Object.keys(de.bookshelf.lock).sort()).toEqual(Object.keys(en.bookshelf.lock).sort());
  });

  it("locks only the right shelf of the isolated bookshelf and gates owner tools", () => {
    const view = read("components/catalogue/IsolatedBookshelfView.tsx");
    expect(view).toContain("generalLock={<BookshelfUnlockPanel />}");
    expect(view).toContain("...lockedShelfDummyBooks()");
    const shell = read("components/talisbooks/library/TalisBooksLibraryShell.tsx");
    expect(shell).toContain('"talisbooks-library__niche--locked"');
    expect(shell).toContain("inert={generalLocked ? true : undefined}");
    // The left featured niche is never locked.
    expect(shell).not.toMatch(/niche--featured[^\n]*locked/);
    const fastPage = read("app/talisbooks/fast/[fastCode]/page.tsx");
    expect(fastPage).toContain("hasCompletedMapSiteActivationPayment");
    expect(fastPage).toContain("<BookshelfUnregisteredNotice />");
    expect(fastPage).toMatch(/canManageEbook \? \(/);
  });
});
