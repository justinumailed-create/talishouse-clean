import { describe, it, expect } from "vitest";
import { buildMapSiteLayoutData } from "../lib/mapsite-layout";
import type { MapSiteView } from "../lib/mapsite-service";

const baseMapsite: MapSiteView = {
  id: "mapsite-1",
  fastCode: "ar01",
  accountId: "account-1",
  slug: "ABCD",
  accountType: "root",
  ownerFirstName: "Arun",
  ownerLastName: "Rachuri",
  agentName: null,
  email: "arun@example.com",
  phone: "4165550100",
  website: null,
  status: "draft",
  propertyTitle: null,
  propertyAddress: null,
  propertyDescription: null,
  latitude: null,
  longitude: null,
  price: null,
  profileImageUrl: null,
  logoUrl: null,
  headerImageUrl: null,
  videoUrl: null,
  galleryImages: [],
  galleryItems: [],
  mapZoom: null,
  metaTitle: null,
  metaDescription: null,
  ogImageUrl: null,
  atlistMapUrl: null,
  offeredSubscriptionTier: "root",
  interestFormEnabled: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  mlsUrl: null,
  brokerUrl: null,
  tebUrl: null,
  ttvUrl: null,
  pins: [
    {
      id: "pin-1",
      name: "King Street Residence",
      description: "Four-bedroom modular home with lake views.",
      latitude: 43.65,
      longitude: -79.38,
      address: "123 King St",
      city: "Toronto",
      province: "ON",
      postalCode: "M5H 1A1",
      country: "Canada",
      website: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      phone: "4165550100",
      email: "listing@example.com",
      featured: true,
      sortOrder: 1,
    },
  ],
};

describe("buildMapSiteLayoutData", () => {
  it("uses pin data for property title and summary when no explicit title exists", () => {
    const layout = buildMapSiteLayoutData(baseMapsite);

    expect(layout.propertyTitle).toBe("King Street Residence");
    expect(layout.summary.description).toBe(
      "Four-bedroom modular home with lake views."
    );
    expect(layout.summary.city).toBe("Toronto");
    expect(layout.agent.name).toBe("Arun Rachuri");
    expect(layout.pins).toHaveLength(1);
  });

  it("resolves video and gallery content from database fields", () => {
    const layout = buildMapSiteLayoutData({
      ...baseMapsite,
      videoUrl: null,
      galleryImages: ["https://cdn.example.com/photo-1.jpg"],
      galleryItems: [
        {
          url: "https://cdn.example.com/photo-1.jpg",
          description: "",
          sortOrder: 0,
          visible: true,
        },
      ],
      profileImageUrl: "https://cdn.example.com/agent.jpg",
      pins: [
        {
          ...baseMapsite.pins[0],
          website: "",
        },
      ],
    });

    expect(layout.videoUrl).toBeNull();
    expect(layout.galleryImages).toEqual(["https://cdn.example.com/photo-1.jpg"]);
    expect(layout.galleryItems).toEqual([
      { url: "https://cdn.example.com/photo-1.jpg", description: "" },
    ]);
    expect(layout.agent.profileImageUrl).toBe("https://cdn.example.com/agent.jpg");
  });

  it("embeds youtube links from pin website values", () => {
    const layout = buildMapSiteLayoutData(baseMapsite);

    expect(layout.videoUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("exposes map center and overlay card fields", () => {
    const layout = buildMapSiteLayoutData({
      ...baseMapsite,
      headerImageUrl: "https://cdn.example.com/hero.jpg",
      price: "$129,000",
      pins: [{ ...baseMapsite.pins[0], name: "LRG1-TTV" }],
    });

    expect(layout.mapCenter).toEqual([43.65, -79.38]);
    expect(layout.pinLabel).toBe("LRG1-TTV");
    expect(layout.overlayImageUrl).toBe("https://cdn.example.com/hero.jpg");
    expect(layout.summary.price).toBe("$129,000");
  });
});
