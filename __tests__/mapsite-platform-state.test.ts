import { describe, expect, it } from "vitest";
import {
  canTransition,
  isClaimable,
  pinPhaseLabel,
  showsResourceActions,
  toDbStatus,
  toPlatformStatus,
} from "../lib/talispros/mapsite-state";

describe("Mapsite™ platform state machine", () => {
  it("maps database statuses to platform statuses", () => {
    expect(toPlatformStatus("unclaimed")).toBe("UNCLAIMED");
    expect(toPlatformStatus("build_request_submitted")).toBe(
      "BUILD_REQUEST_SUBMITTED"
    );
    expect(toPlatformStatus("marketing_review")).toBe("MARKETING_REVIEW");
    expect(toPlatformStatus("active")).toBe("ACTIVE");
    expect(toPlatformStatus("draft")).toBe("MARKETING_REVIEW");
  });

  it("round-trips platform statuses to database values", () => {
    expect(toDbStatus("UNCLAIMED")).toBe("unclaimed");
    expect(toDbStatus("BUILD_REQUEST_SUBMITTED")).toBe(
      "build_request_submitted"
    );
    expect(toDbStatus("ACTIVE")).toBe("active");
  });

  it("allows the claim → review → active path", () => {
    expect(canTransition("UNCLAIMED", "BUILD_REQUEST_SUBMITTED")).toBe(true);
    expect(
      canTransition("BUILD_REQUEST_SUBMITTED", "MARKETING_REVIEW")
    ).toBe(true);
    expect(canTransition("MARKETING_REVIEW", "ACTIVE")).toBe(true);
    expect(canTransition("UNCLAIMED", "ACTIVE")).toBe(false);
  });

  it("drives popup UI from status", () => {
    expect(isClaimable("UNCLAIMED")).toBe(true);
    expect(isClaimable("BUILD_REQUEST_SUBMITTED")).toBe(false);
    expect(showsResourceActions("BUILD_REQUEST_SUBMITTED")).toBe(true);
    expect(showsResourceActions("ACTIVE")).toBe(true);
    expect(showsResourceActions("UNCLAIMED")).toBe(false);
    expect(pinPhaseLabel("BUILD_REQUEST_SUBMITTED")).toBe("PENDING");
    expect(pinPhaseLabel("ACTIVE")).toBe("ACTIVE");
  });
});
