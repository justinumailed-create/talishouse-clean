import { describe, expect, it } from "vitest";
import {
  firstNonPersonalMapsiteLabel,
  isFormalLotOrAddressLabel,
  isPersonalNameLabel,
  mapsitePublicPinLabel,
} from "../lib/mapsite-pin-label";

describe("mapsitePublicPinLabel", () => {
  it("uses location instead of the registrant name on LG02-style data", () => {
    const label = mapsitePublicPinLabel({
      propertyTitle: "Lydia Gaertner",
      lotLabel: "Lydia Gaertner",
      address: "5 HEAD RD, HOMEVILLE, NS, CANADA",
      city: "Homeville",
      province: "NS",
      country: "Canada",
      ownerName: "Lydia Gaertner",
      agentName: "Lydia Gaertner",
      fallback: "LG02",
    });

    expect(label).not.toMatch(/Lydia/i);
    expect(label).toBe("5 Head Rd, Homeville, NS, Canada");
  });

  it("prefers a formal lot label over a geocoded street line", () => {
    expect(
      mapsitePublicPinLabel({
        lotLabel: "Lot 8, South Head Road, Homeville, Nova Scotia",
        propertyTitle: "Lydia Gaertner",
        address: "5 HEAD RD, HOMEVILLE, NS, CANADA",
        ownerName: "Lydia Gaertner",
      }),
    ).toBe("Lot 8, South Head Road, Homeville, Nova Scotia");
  });

  it("composes street, community, and province when no full address exists", () => {
    expect(
      mapsitePublicPinLabel({
        propertyTitle: "Arun Rachuri",
        address: "123 King St",
        city: "Toronto",
        province: "ON",
        country: "Canada",
        ownerName: "Arun Rachuri",
      }),
    ).toBe("123 King St, Toronto, ON, Canada");
  });

  it("never falls back to a personal name", () => {
    expect(
      mapsitePublicPinLabel({
        propertyTitle: "Lydia Gaertner",
        ownerName: "Lydia Gaertner",
        fallback: "Lydia Gaertner",
      }),
    ).toBe("Location");
  });

  it("keeps demo lot copy when that is the stored address", () => {
    expect(
      mapsitePublicPinLabel({
        propertyTitle: "Lot + optional Tiny Home",
        address: "Lot 8, South Head Road, Homeville, Nova Scotia, Canada.",
      }),
    ).toBe("Lot 8, South Head Road, Homeville, Nova Scotia, Canada");
  });
});

describe("isPersonalNameLabel", () => {
  it("detects two-word personal names and Name Mapsite™ titles", () => {
    expect(isPersonalNameLabel("Lydia Gaertner")).toBe(true);
    expect(isPersonalNameLabel("Lydia Gaertner Mapsite™", ["Lydia Gaertner"])).toBe(
      true,
    );
    expect(isPersonalNameLabel("5 Head Rd, Homeville")).toBe(false);
    expect(isPersonalNameLabel("Lot 8, South Head Road")).toBe(false);
  });
});

describe("isFormalLotOrAddressLabel", () => {
  it("accepts lot numbers and street addresses only", () => {
    expect(isFormalLotOrAddressLabel("Lot 8, South Head Road")).toBe(true);
    expect(isFormalLotOrAddressLabel("5 HEAD RD, HOMEVILLE, NS")).toBe(true);
    expect(isFormalLotOrAddressLabel("King Street Residence")).toBe(false);
    expect(isFormalLotOrAddressLabel("Lot + optional Tiny Home")).toBe(false);
    expect(isFormalLotOrAddressLabel("Lydia Gaertner")).toBe(false);
  });
});

describe("firstNonPersonalMapsiteLabel", () => {
  it("skips the owner name when storing a Mapsite™ title", () => {
    expect(
      firstNonPersonalMapsiteLabel(
        ["Lydia Gaertner", "5 Head Rd, Homeville, NS"],
        ["Lydia Gaertner"],
      ),
    ).toBe("5 Head Rd, Homeville, NS");
  });
});
