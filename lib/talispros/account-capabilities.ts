import type { RegistrationMarket } from "@/lib/registration-market";

export type MapSiteCapabilityAccountType =
  | "corporate"
  | "root"
  | "derivative"
  | "fsbo"
  | "adpro";

export type MapSiteResourceKey = "mls" | "url" | "teb" | "ttv";

export interface MapSiteAccountCapabilities {
  accountType: MapSiteCapabilityAccountType;
  displayName: string;
  resourceButtons: readonly MapSiteResourceKey[];
  maxPropertyPins: number;
  canLicenseDerivativeAccounts: boolean;
  displayOnlyOnMarketsPage: boolean;
  actsAsMarketOwner: boolean;
}

const CAPABILITIES: Record<
  MapSiteCapabilityAccountType,
  MapSiteAccountCapabilities
> = {
  corporate: {
    accountType: "corporate",
    displayName: "Corporate",
    resourceButtons: [],
    maxPropertyPins: 0,
    canLicenseDerivativeAccounts: false,
    displayOnlyOnMarketsPage: true,
    actsAsMarketOwner: true,
  },
  root: {
    accountType: "root",
    displayName: "Root Account",
    resourceButtons: ["url"],
    maxPropertyPins: 1,
    canLicenseDerivativeAccounts: true,
    displayOnlyOnMarketsPage: false,
    actsAsMarketOwner: false,
  },
  derivative: {
    accountType: "derivative",
    displayName: "Derivative",
    resourceButtons: ["url", "mls", "teb", "ttv"],
    maxPropertyPins: 100,
    canLicenseDerivativeAccounts: false,
    displayOnlyOnMarketsPage: false,
    actsAsMarketOwner: false,
  },
  fsbo: {
    accountType: "fsbo",
    displayName: "FSBO",
    resourceButtons: ["url", "teb", "ttv"],
    maxPropertyPins: 1,
    canLicenseDerivativeAccounts: false,
    displayOnlyOnMarketsPage: false,
    actsAsMarketOwner: false,
  },
  adpro: {
    accountType: "adpro",
    displayName: "Adpros",
    resourceButtons: ["url", "teb", "ttv"],
    maxPropertyPins: 1,
    canLicenseDerivativeAccounts: false,
    displayOnlyOnMarketsPage: false,
    actsAsMarketOwner: false,
  },
};

export function capabilitiesForAccountType(
  accountType: MapSiteCapabilityAccountType
): MapSiteAccountCapabilities {
  return CAPABILITIES[accountType];
}

export function accountTypeForAudience(
  audience: RegistrationMarket
): MapSiteCapabilityAccountType {
  if (audience === "brokers") return "root";
  if (audience === "fsbos") return "fsbo";
  if (audience === "adpro") return "adpro";
  return "derivative";
}
