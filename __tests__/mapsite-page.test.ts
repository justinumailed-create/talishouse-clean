import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildClaimedMapSiteHref, getMapSiteByFastCode } from "../lib/mapsite-service";

const mockMapsitesMaybeSingle = vi.fn();
const mockMapsitesByIdMaybeSingle = vi.fn();
const mockPinsOrder = vi.fn();
const mockPinsEq = vi.fn();
const mockFastCodesIlikeMaybeSingle = vi.fn();
const mockFastCodesByMapsiteMaybeSingle = vi.fn();
const mockBuildRequestsMaybeSingle = vi.fn();
const mockAssetsMaybeSingle = vi.fn();

function mapsitesQuery() {
  return {
    select: () => ({
      ilike: () => ({
        maybeSingle: mockMapsitesMaybeSingle,
      }),
      eq: () => ({
        maybeSingle: mockMapsitesByIdMaybeSingle,
      }),
    }),
  };
}

function pinsQuery() {
  return {
    select: () => ({
      eq: (...args: unknown[]) => {
        mockPinsEq(...args);
        return { order: mockPinsOrder };
      },
    }),
  };
}

function fastCodesQuery() {
  return {
    select: () => ({
      ilike: () => ({
        maybeSingle: mockFastCodesIlikeMaybeSingle,
      }),
      eq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: mockFastCodesByMapsiteMaybeSingle,
          }),
        }),
        maybeSingle: mockFastCodesByMapsiteMaybeSingle,
      }),
    }),
  };
}

vi.mock("../lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "mapsites") return mapsitesQuery();
      if (table === "pins") return pinsQuery();
      if (table === "fast_codes") return fastCodesQuery();
      if (table === "build_requests") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockBuildRequestsMaybeSingle,
            }),
          }),
        };
      }
      if (table === "mapsite_assets") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockAssetsMaybeSingle,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
  tryGetSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "mapsites") return mapsitesQuery();
      if (table === "pins") return pinsQuery();
      if (table === "fast_codes") return fastCodesQuery();
      if (table === "build_requests") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockBuildRequestsMaybeSingle,
            }),
          }),
        };
      }
      if (table === "mapsite_assets") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockAssetsMaybeSingle,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
  disableSupabaseAdminClient: vi.fn(),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: () => {
      throw new Error("anon client should not be used when admin is available");
    },
  },
}));

describe("getMapSiteByFastCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPinsOrder.mockResolvedValue({ data: [], error: null });
    mockFastCodesIlikeMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockFastCodesByMapsiteMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockMapsitesByIdMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockBuildRequestsMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockAssetsMaybeSingle.mockResolvedValue({ data: null, error: null });
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

  it("keeps the looked-up FAST Code when mapsite row was overwritten to DEMO", async () => {
    mockMapsitesMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockFastCodesIlikeMaybeSingle.mockResolvedValue({
      data: {
        code: "lg01",
        mapsite_id: "00000000-0000-4000-8000-000000000001",
        request_id: "req-lg01",
      },
      error: null,
    });
    mockMapsitesByIdMaybeSingle.mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        fast_code: "DEMO",
        account_id: null,
        slug: "demo",
        account_type: "root",
        owner_first_name: "Demo",
        owner_last_name: "User",
        email: "demo@example.com",
        phone: "",
        status: "unclaimed",
        property_title: "Lot + optional Tiny Home",
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
    mockBuildRequestsMaybeSingle.mockResolvedValue({
      data: { market_type: "listings", status: "Registered" },
      error: null,
    });

    const result = await getMapSiteByFastCode("lg01");

    expect(result).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      fastCode: "lg01",
      requestId: "req-lg01",
      claimAudience: "listings",
    });
    expect(
      buildClaimedMapSiteHref({
        mapsiteId: result!.id,
        fastCode: result!.fastCode,
        requestId: result!.requestId,
        audience: result!.claimAudience,
      })
    ).toContain("/talispros/mapsite/listings/lg01");
    expect(
      buildClaimedMapSiteHref({
        mapsiteId: result!.id,
        fastCode: result!.fastCode,
        requestId: result!.requestId,
        audience: result!.claimAudience,
      })
    ).not.toContain("requestId=");
  });
});

describe("buildClaimedMapSiteHref", () => {
  it("uses the short /talispros/mapsite/{accountType}/{fastCode} path", () => {
    const href = buildClaimedMapSiteHref({
      mapsiteId: "00000000-0000-4000-8000-000000000001",
      fastCode: "lg01",
      requestId: "da2ffada-d634-4759-8cd0-92428e1aac50",
      audience: "listings",
    });
    expect(href).toBe("/talispros/mapsite/listings/lg01");
  });

  it("normalizes root-1 claims to /root/{fastCode} when no audience is set", () => {
    expect(
      buildClaimedMapSiteHref({
        mapsiteId: "abc",
        fastCode: "RC08",
        accountType: "root-1",
      })
    ).toBe("/talispros/mapsite/root/rc08");
  });
});
