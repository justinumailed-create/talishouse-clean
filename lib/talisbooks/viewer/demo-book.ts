import type { TalisBooksViewerBook, TalisBooksViewerPage } from "./types";
import { MAPSITE_DEMO_LOCATION } from "@/lib/mapsite/demo-location";
import { ensurePermanentClosingPages } from "@/lib/talisbooks/permanent-pages";

const ASSET = "/talisbooks/sample/clean";
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
 * FSBO demonstration TalisBook™ — optimized for owner-seller onboarding.
 *
 * Intentionally omits broker branding, corporate pages, and pages 2–3 brokerage
 * layouts. Those remain scaffolded in `brokerage-scaffold.ts` for a future
 * brokerage demonstration mode.
 *
 * Shape: cover → MapSite location → property story → Glasshouse brochure (permanent)
 * → soft back cover. ensurePermanentClosingPages() injects brochure before back cover.
 */
export function createDemoViewerBook(): TalisBooksViewerBook {
  const storyPages: TalisBooksViewerPage[] = [
    {
      id: "p1",
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: "Meat Cove Retreat",
      subtitle: ADDRESS,
      address: ADDRESS,
      coverTemplateId: "horizon-caption",
      heroImageUrl: `${ASSET}/cover.jpg`,
    },
    {
      id: "p2",
      pageNumber: 2,
      pageRole: "property_content",
      layout: "maps",
      title: "Find it on the map",
      address: MAPSITE_DEMO_LOCATION.streetAddress,
      latitude: MAPSITE_DEMO_LOCATION.latitude,
      longitude: MAPSITE_DEMO_LOCATION.longitude,
      mapZoom: MAPSITE_DEMO_LOCATION.mapZoom,
      body: "Your MapSite™ PIN marks the property. Tap through for the full interactive story — no brokerage page required.",
    },
    ...centerfoldPair(3, "03", {
      title: "Cabins on the Ridge",
      body: "Three arched-roof cabins sit on the grassy ridge — dark cedar, quiet porches, and an open horizon to the Atlantic.",
    }),
    ...centerfoldPair(5, "02", {
      title: "The Cove",
      body: "A crescent beach tucked between cliffs and forest. Turquoise shallows, pebble shore, room to breathe.",
    }),
    propertyPage(
      7,
      "07.jpg",
      "Cliffside Picnic",
      "A red table on the grass above the bay. Lunch with a cliff-line view and nowhere urgent to be.",
      "full_bleed",
    ),
    propertyPage(
      8,
      "04.jpg",
      "Inside the Cabin",
      "Light wood walls, vaulted ceiling, and a doorway that opens straight to grass, deck, and sky.",
      "caption",
    ),
    ...centerfoldPair(9, "01", {
      title: "Open Water",
      body: "Pale sky, deep Atlantic, and a dark evergreen ridge — the cover landscape as a full centerfold.",
    }),
    propertyPage(
      11,
      "05.jpg",
      "Forest Edge",
      "Shade and scrub meet the lawn — the soft boundary between cabin life and the trail to the beach.",
      "caption",
    ),
    propertyPage(
      12,
      "08.jpg",
      "Afternoon Stillness",
      "Wide water and quiet air. A pause before the last look at the place.",
      "full_bleed",
    ),
    propertyPage(
      13,
      "09.jpg",
      "Last Light",
      "One more frame of the property before the Glasshouse™ brochure and back cover.",
      "parting",
    ),
    {
      id: "p-back",
      pageNumber: 14,
      pageRole: "cover",
      layout: "cover",
      title: "Meat Cove Retreat",
      subtitle: ADDRESS,
      address: ADDRESS,
      coverTemplateId: "horizon-caption",
      heroImageUrl: `${ASSET}/back-cover.jpg`,
      body: "Listed by the owner · Open the MapSite™ PIN for details.",
    },
  ];

  const pages = ensurePermanentClosingPages(storyPages);

  return {
    id: "demo-sample-ebook",
    slug: "sample-ebook",
    title: "Meat Cove Retreat",
    subtitle: ADDRESS,
    listingProfile: "fsbo",
    viewerStyle: "magazine",
    frontCoverImageUrl: `${ASSET}/cover.jpg`,
    backCoverImageUrl: `${ASSET}/back-cover.jpg`,
    pages,
  };
}
