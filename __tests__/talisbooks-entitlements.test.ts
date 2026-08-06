import { describe, expect, it } from "vitest";
import {
  TALISBOOKS_ACTIVATED_BOOK_QUOTAS,
  TALISBOOKS_UNACTIVATED_BOOK_QUOTA,
  assertTalisBooksFeature,
  evaluateTalisBooksEntitlements,
  getTalisBooksBookQuota,
  isTalisBooksAccountActivated,
  resolveTalisBooksAccountKind,
} from "../lib/talisbooks/entitlements";

describe("Talisbooks™ activation entitlements", () => {
  it("treats Mapsite™ ACTIVE or activated_at as activated", () => {
    expect(isTalisBooksAccountActivated({ mapsiteStatus: "ACTIVE" })).toBe(true);
    expect(
      isTalisBooksAccountActivated({ activatedAt: "2026-07-01T00:00:00.000Z" }),
    ).toBe(true);
    expect(isTalisBooksAccountActivated({ mapsiteStatus: "MARKETING_REVIEW" })).toBe(
      false,
    );
  });

  it("resolves account kinds including Adpro / FSBO audiences", () => {
    expect(resolveTalisBooksAccountKind({ accountType: "root" })).toBe("root");
    expect(resolveTalisBooksAccountKind({ accountType: "derivative" })).toBe(
      "derivative",
    );
    expect(resolveTalisBooksAccountKind({ audience: "adpro" })).toBe("adpro");
    expect(resolveTalisBooksAccountKind({ audience: "fsbos" })).toBe("adpro");
  });

  it("allows one unactivated draft and locks premium features", () => {
    const entitlements = evaluateTalisBooksEntitlements({
      activated: false,
      accountKind: "root",
      bookCount: 0,
      registrationHref: "/talispros/mapsite/listings/demo",
    });

    expect(entitlements.bookQuota).toBe(TALISBOOKS_UNACTIVATED_BOOK_QUOTA);
    expect(entitlements.canCreateFirstDraft).toBe(true);
    expect(entitlements.canCreateAdditionalBook).toBe(false);
    expect(entitlements.canPublish).toBe(false);
    expect(entitlements.canGlobalMarket).toBe(false);
    expect(entitlements.canAdditionalUploads).toBe(false);
    expect(entitlements.canUseBookshelf).toBe(false);
    expect(entitlements.canCreateDerivativeBook).toBe(false);
    expect(entitlements.canCreateAdproBook).toBe(false);
  });

  it("blocks a second book before activation", () => {
    const entitlements = evaluateTalisBooksEntitlements({
      activated: false,
      accountKind: "root",
      bookCount: 1,
      registrationHref: "/activate",
    });
    expect(entitlements.canCreateFirstDraft).toBe(false);
    expect(assertTalisBooksFeature(entitlements, "create_additional_book").ok).toBe(
      false,
    );
    expect(assertTalisBooksFeature(entitlements, "publish").ok).toBe(false);
  });

  it("unlocks root quota after activation", () => {
    const entitlements = evaluateTalisBooksEntitlements({
      activated: true,
      accountKind: "root",
      bookCount: 1,
      registrationHref: "/activate",
    });
    expect(entitlements.bookQuota).toBe(TALISBOOKS_ACTIVATED_BOOK_QUOTAS.root);
    expect(entitlements.canCreateAdditionalBook).toBe(true);
    expect(entitlements.canPublish).toBe(true);
    expect(entitlements.canUseBookshelf).toBe(true);
    expect(entitlements.canCreateDerivativeBook).toBe(true);
    expect(entitlements.canCreateAdproBook).toBe(false);
  });

  it("unlocks Adpro PIN quota of one book after activation", () => {
    expect(getTalisBooksBookQuota({ activated: true, accountKind: "adpro" })).toBe(1);
    const entitlements = evaluateTalisBooksEntitlements({
      activated: true,
      accountKind: "adpro",
      bookCount: 0,
      registrationHref: "/activate",
    });
    expect(entitlements.canCreateAdproBook).toBe(true);
    expect(entitlements.canCreateDerivativeBook).toBe(false);
    expect(
      evaluateTalisBooksEntitlements({
        activated: true,
        accountKind: "adpro",
        bookCount: 1,
        registrationHref: "/activate",
      }).canCreateAdditionalBook,
    ).toBe(false);
  });
});
