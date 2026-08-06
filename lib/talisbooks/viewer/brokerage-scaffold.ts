/**
 * Future brokerage / corporate page scaffolds.
 *
 * The live sample demo is FSBO-only and does not mount these pages.
 * Keep this module as the seed for broker-branded demos and compliance fixtures
 * (pages 2–3 + closing duplicate) without wiring them into createDemoViewerBook().
 */

import type { TalisBooksViewerPage } from "./types";
import { MAPSITE_DEMO_LOCATION } from "@/lib/mapsite/demo-location";

const ASSET = "/talisbooks/sample/clean";

/** Sample broker identity — reserved for future brokerage demonstration mode. */
export const TALISBOOKS_BROKERAGE_DEMO_AGENT = {
  name: "Ralf Meyer",
  title: "Root Account Holder · Coastal Listings",
  phone: "902-317-2223",
  email: "remecom@mac.com",
  photoUrl: `${ASSET}/portrait.jpg`,
  brokerageName: "Talispros™ Partner Realty",
  brokerageLine: "Cape Breton · Meat Cove · Atlantic Shore",
  brokerageLogoUrl: `${ASSET}/brokerage-banner.jpg`,
  slogan: "Where the Atlantic finds you.",
  mission:
    "We connect buyers and guests with coastal places worth staying for - honest photos, clear location, and a Mapsite™ PIN that opens the full story.",
} as const;

/**
 * Official brokerage page 2 — agent intro + brokerage branding.
 * Not used by the FSBO sample viewer.
 */
export function createBrokeragePage2Scaffold(
  pageNumber = 2,
): TalisBooksViewerPage {
  const agent = TALISBOOKS_BROKERAGE_DEMO_AGENT;
  return {
    id: `brokerage-scaffold-p${pageNumber}`,
    pageNumber,
    pageRole: "agent_brokerage",
    layout: "agent_intro",
    title: "Your Listing Host",
    agentName: agent.name,
    agentTitle: agent.title,
    agentPhone: agent.phone,
    agentEmail: agent.email,
    agentPhotoUrl: agent.photoUrl,
    brokerageName: agent.brokerageName,
    brokerageLine: agent.brokerageLine,
    brokerageLogoUrl: agent.brokerageLogoUrl,
    slogan: agent.slogan,
    mission: agent.mission,
  };
}

/**
 * Official brokerage page 3 — agent summary (compliance mirror for closing).
 * Not used by the FSBO sample viewer (FSBO page 2 is Mapsite™ location instead).
 */
export function createBrokeragePage3Scaffold(
  pageNumber = 3,
): TalisBooksViewerPage {
  const agent = TALISBOOKS_BROKERAGE_DEMO_AGENT;
  return {
    id: `brokerage-scaffold-p${pageNumber}`,
    pageNumber,
    pageRole: "agent_brokerage",
    layout: "agent_summary",
    title: "Brokerage Compliance",
    agentName: agent.name,
    agentTitle: agent.title,
    agentPhone: agent.phone,
    agentEmail: agent.email,
    agentPhotoUrl: agent.photoUrl,
    brokerageName: agent.brokerageName,
    brokerageLine: agent.brokerageLine,
    brokerageLogoUrl: agent.brokerageLogoUrl,
    slogan: agent.slogan,
    mission: agent.mission,
    address: MAPSITE_DEMO_LOCATION.streetAddress,
  };
}

/**
 * Closing page that duplicates page 3 brokerage layout (publish rule).
 * Not used by the FSBO sample viewer (FSBO closing is a soft back cover).
 */
export function createBrokerageClosingScaffold(
  pageNumber: number,
): TalisBooksViewerPage {
  return {
    ...createBrokeragePage3Scaffold(pageNumber),
    id: `brokerage-scaffold-closing-p${pageNumber}`,
  };
}
