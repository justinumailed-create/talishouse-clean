import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMapSiteByFastCode } from "../lib/mapsite-service";

const mockMapsitesMaybeSingle = vi.fn();
const mockPinsOrder = vi.fn();
const mockPinsEq = vi.fn();
const mockFastCodesMaybeSingle = vi.fn();

vi.mock("../lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "mapsites") {
        return {
          select: () => ({
            ilike: () => ({
              maybeSingle: mockMapsitesMaybeSingle,
            }),
          }),
        };
      }

      if (table === "pins") {
        return {
          select: () => ({
            eq: (...args: unknown[]) => {
              mockPinsEq(...args);
              return { order: mockPinsOrder };
            },
          }),
        };
      }

      if (table === "fast_codes") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockFastCodesMaybeSingle,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe("getMapSiteByFastCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPinsOrder.mockResolvedValue({ data: [], error: null });
    mockFastCodesMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns null when the FAST Code does not exist", async () => {
    mockMapsitesMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getMapSiteByFastCode("missing01");

    expect(result).toBeNull();
  });

  it("returns the MapSite and its pins from the database", async () => {
    mockMapsitesMaybeSingle.mockResolvedValue({
      data: {
        id: "mapsite-1",
        fast_code: "ar01",
        account_id: "account-1",
        slug: "ABCD",
        account_type: "root",
        owner_first_name: "Arun",
        owner_last_name: "Rachuri",
        email: "arun@example.com",
        phone: "",
        status: "draft",
        property_title: null,
        property_address: null,
        property_description: null,
        latitude: null,
        longitude: null,
        price: null,
        profile_image_url: null,
        logo_url: null,
        header_image_url: null,
        video_url: null,
        gallery_images: [],
        website: null,
        map_zoom: null,
        meta_title: null,
        meta_description: null,
        og_image_url: null,
        agent_name: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      error: null,
    });

    mockPinsOrder.mockResolvedValue({
      data: [
        {
          id: "pin-1",
          name: "Main Office",
          description: "Primary location",
          latitude: 43.65,
          longitude: -79.38,
          address: "123 King St",
          city: "Toronto",
          province: "ON",
          postal_code: "M5H 1A1",
          country: "Canada",
          website: "",
          phone: "",
          email: "",
          featured: false,
          sort_order: 1,
        },
      ],
      error: null,
    });

    const result = await getMapSiteByFastCode("ar01");

    expect(result).toMatchObject({
      id: "mapsite-1",
      fastCode: "ar01",
      accountId: "account-1",
      status: "draft",
      ownerFirstName: "Arun",
      ownerLastName: "Rachuri",
      email: "arun@example.com",
    });
    expect(result?.pins).toHaveLength(1);
    expect(result?.pins[0].name).toBe("Main Office");
    expect(mockPinsEq).toHaveBeenCalledWith("mapsite_id", "mapsite-1");
  });
});
