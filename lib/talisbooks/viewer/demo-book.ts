import type { TalisBooksViewerBook, TalisBooksViewerPage } from "./types";
import { MAPSITE_DEMO_LOCATION } from "@/lib/mapsite/demo-location";

const ASSET = "/talisbooks/sample/clean";

const AGENT = {
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
    "We connect buyers and guests with coastal places worth staying for - honest photos, clear location, and a Mapsite PIN that opens the full story.",
} as const;

const ADDRESS = MAPSITE_DEMO_LOCATION.streetAddress;

function centerfoldPair(
  startPage: number,
  imageNumber: string,
  caption: { title: string; body: string },
): TalisBooksViewerPage[] {
  const spreadImageUrl = `${ASSET}/${imageNumber}.jpg`;
  return [
    {
      id: `p${startPage}`,
      pageNumber: startPage,
      pageRole: "property_content",
      layout: "centerfold_left",
      title: "",
      heroImageUrl: `${ASSET}/${imageNumber}-left.jpg`,
      spreadImageUrl,
    },
    {
      id: `p${startPage + 1}`,
      pageNumber: startPage + 1,
      pageRole: "property_content",
      layout: "centerfold_right",
      title: caption.title,
      body: caption.body,
      heroImageUrl: `${ASSET}/${imageNumber}-right.jpg`,
      spreadImageUrl,
    },
  ];
}

function propertyPage(
  pageNumber: number,
  imageFile: string,
  title: string,
  body: string,
  layout: "caption" | "full_bleed" | "parting" = "caption",
): TalisBooksViewerPage {
  return {
    id: `p${pageNumber}`,
    pageNumber,
    pageRole: "property_content",
    layout,
    title,
    body,
    heroImageUrl: `${ASSET}/${imageFile}`,
  };
}

/**
 * Sample E-Book for live demos — structured from TEB-TWO2 bones + Ralf's photo set.
 * 16 pages within official 12–22 bounds: cover, pages 2–3 brokerage, interiors, closing = page 3.
 */
export function createDemoViewerBook(): TalisBooksViewerBook {
  const page2: TalisBooksViewerPage = {
    id: "p2",
    pageNumber: 2,
    pageRole: "agent_brokerage",
    layout: "agent_intro",
    title: "Your Listing Host",
    agentName: AGENT.name,
    agentTitle: AGENT.title,
    agentPhone: AGENT.phone,
    agentEmail: AGENT.email,
    agentPhotoUrl: AGENT.photoUrl,
    brokerageName: AGENT.brokerageName,
    brokerageLine: AGENT.brokerageLine,
    brokerageLogoUrl: AGENT.brokerageLogoUrl,
    slogan: AGENT.slogan,
    mission: AGENT.mission,
  };

  const page3: TalisBooksViewerPage = {
    id: "p3",
    pageNumber: 3,
    pageRole: "property_content",
    layout: "maps",
    title: "Property Location",
    address: MAPSITE_DEMO_LOCATION.streetAddress,
    latitude: MAPSITE_DEMO_LOCATION.latitude,
    longitude: MAPSITE_DEMO_LOCATION.longitude,
    mapZoom: MAPSITE_DEMO_LOCATION.mapZoom,
    body: "Street address or geo-coordinates place the Mapsite PIN — tap through to the full interactive property story.",
  };

  const closingBrokeragePage: TalisBooksViewerPage = {
    id: "p16",
    pageNumber: 16,
    pageRole: "agent_brokerage",
    layout: "agent_summary",
    title: "Continue the Conversation",
    agentName: AGENT.name,
    agentTitle: AGENT.title,
    agentPhone: AGENT.phone,
    agentEmail: AGENT.email,
    agentPhotoUrl: AGENT.photoUrl,
    brokerageName: AGENT.brokerageName,
    brokerageLine: AGENT.brokerageLine,
    brokerageLogoUrl: AGENT.brokerageLogoUrl,
    slogan: AGENT.slogan,
    mission:
      "Every listing auto-generates a TalisBooks E-Book on your Mapsite - street address or geo-coordinates place the PIN, and up to twelve photos become cover, centerfolds, and parting shot.",
    body: `${AGENT.slogan} Reach ${AGENT.name} at ${AGENT.phone} or ${AGENT.email}. Mapsite flags: URL · MLS · TEB · TTV.`,
  };

  const pages: TalisBooksViewerPage[] = [
    {
      id: "p1",
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: "Sample E-Book",
      subtitle: ADDRESS,
      address: ADDRESS,
      coverTemplateId: "horizon-caption",
      heroImageUrl: `${ASSET}/cover.jpg`,
    },
    page2,
    page3,
    ...centerfoldPair(4, "03", {
      title: "Cabins on the Ridge",
      body: "Three arched-roof cabins sit on the grassy ridge - dark cedar, quiet porches, and an open horizon to the Atlantic.",
    }),
    ...centerfoldPair(6, "02", {
      title: "The Cove",
      body: "A crescent beach tucked between cliffs and forest. Turquoise shallows, pebble shore, room to breathe.",
    }),
    propertyPage(
      8,
      "07.jpg",
      "Cliffside Picnic",
      "A red table on the grass above the bay. Lunch with a cliff-line view and nowhere urgent to be.",
      "full_bleed",
    ),
    propertyPage(
      9,
      "04.jpg",
      "Inside the Cabin",
      "Light wood walls, vaulted ceiling, and a doorway that opens straight to grass, deck, and sky.",
      "caption",
    ),
    ...centerfoldPair(10, "01", {
      title: "Open Water",
      body: "Pale sky, deep Atlantic, and a dark evergreen ridge - the cover landscape, now as a full centerfold.",
    }),
    propertyPage(
      12,
      "05.jpg",
      "Forest Edge",
      "Shade and scrub meet the lawn - the soft boundary between cabin life and the trail to the beach.",
      "caption",
    ),
    propertyPage(
      13,
      "08.jpg",
      "Afternoon Stillness",
      "Wide water and quiet air. A pause page before the parting shot.",
      "full_bleed",
    ),
    ...centerfoldPair(14, "12", {
      title: "Parting Shot",
      body: `The essence of the listing - water, light, and the promise of return. ${AGENT.name} · ${AGENT.phone}`,
    }),
    closingBrokeragePage,
  ];

  return {
    id: "demo-sample-ebook",
    slug: "sample-ebook",
    title: "Sample E-Book",
    subtitle: ADDRESS,
    frontCoverImageUrl: `${ASSET}/cover.jpg`,
    backCoverImageUrl: `${ASSET}/back-cover.jpg`,
    pages,
  };
}
