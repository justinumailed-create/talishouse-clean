import { describe, expect, it } from "vitest";
import {
  getMapSiteOnboardingPhase,
  isPendingActivationPhase,
  showsActiveResourceButtons,
} from "../lib/talispros/mapsite-onboarding-phase";

describe("getMapSiteOnboardingPhase", () => {
  it("keeps UNCLAIMED and ARCHIVED", () => {
    expect(
      getMapSiteOnboardingPhase({
        status: "UNCLAIMED",
        paymentReceived: false,
        hasTalisBook: false,
      })
    ).toBe("UNCLAIMED");
    expect(
      getMapSiteOnboardingPhase({
        status: "ARCHIVED",
        paymentReceived: false,
        hasTalisBook: true,
      })
    ).toBe("ARCHIVED");
  });

  it("keeps unpaid platform ACTIVE in pending until PayPal", () => {
    expect(
      getMapSiteOnboardingPhase({
        status: "ACTIVE",
        paymentReceived: false,
        hasTalisBook: false,
      })
    ).toBe("BUILD_SUBMITTED");
    expect(
      getMapSiteOnboardingPhase({
        status: "ACTIVE",
        paymentReceived: false,
        hasTalisBook: true,
      })
    ).toBe("BOOK_READY");
  });

  it("treats paymentReceived as ACTIVE (unlocks resource buttons)", () => {
    expect(
      getMapSiteOnboardingPhase({
        status: "BUILD_REQUEST_SUBMITTED",
        paymentReceived: true,
        hasTalisBook: false,
      })
    ).toBe("ACTIVE");
    expect(
      getMapSiteOnboardingPhase({
        status: "ACTIVE",
        paymentReceived: true,
        hasTalisBook: true,
      })
    ).toBe("ACTIVE");
  });

  it("maps unpaid submitted without book to BUILD_SUBMITTED", () => {
    expect(
      getMapSiteOnboardingPhase({
        status: "BUILD_REQUEST_SUBMITTED",
        paymentReceived: false,
        hasTalisBook: false,
      })
    ).toBe("BUILD_SUBMITTED");
    expect(
      getMapSiteOnboardingPhase({
        status: "MARKETING_REVIEW",
        paymentReceived: false,
        hasTalisBook: false,
      })
    ).toBe("BUILD_SUBMITTED");
  });

  it("maps unpaid submitted with book to BOOK_READY", () => {
    expect(
      getMapSiteOnboardingPhase({
        status: "BUILD_REQUEST_SUBMITTED",
        paymentReceived: false,
        hasTalisBook: true,
      })
    ).toBe("BOOK_READY");
  });

  it("gates resource buttons to ACTIVE phase only", () => {
    expect(showsActiveResourceButtons("ACTIVE")).toBe(true);
    expect(showsActiveResourceButtons("BOOK_READY")).toBe(false);
    expect(showsActiveResourceButtons("BUILD_SUBMITTED")).toBe(false);
    expect(isPendingActivationPhase("BOOK_READY")).toBe(true);
    expect(isPendingActivationPhase("ACTIVE")).toBe(false);
  });
});
