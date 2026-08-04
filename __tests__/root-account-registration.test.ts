import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUsersInsert = vi.fn();
const mockUsersUpdate = vi.fn();
const mockAccountsInsert = vi.fn();
const mockMapsitesInsert = vi.fn();
const mockMapsitesInsertPayload = vi.fn();
const mockMapsitesSelect = vi.fn();
const mockAccountsLike = vi.fn();
const mockMapsitesLike = vi.fn();
const mockFastCodesLike = vi.fn();

vi.mock("../lib/slug-generator", () => ({
  generateMapSiteSlug: vi.fn(async () => "ABCD"),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

vi.mock("../lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "users") {
        return {
          insert: () => ({
            select: () => ({
              single: mockUsersInsert,
            }),
          }),
          update: () => ({
            eq: mockUsersUpdate,
          }),
        };
      }

      if (table === "accounts") {
        return {
          insert: () => ({
            select: () => ({
              single: mockAccountsInsert,
            }),
          }),
          select: () => ({
            like: mockAccountsLike,
          }),
        };
      }

      if (table === "fast_code_registrations") {
        return {
          select: () => ({
            like: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      if (table === "mapsites") {
        return {
          select: (...args: unknown[]) => {
            // createMapSiteForAccount awaits .select("slug") directly
            if (args[0] === "slug") {
              return mockMapsitesSelect();
            }
            // generateFastCode uses .select("fast_code").like(...)
            return {
              like: mockMapsitesLike,
            };
          },
          insert: (record: unknown) => {
            mockMapsitesInsertPayload(record);
            return {
              select: () => ({
                single: mockMapsitesInsert,
              }),
            };
          },
          update: () => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }

      if (table === "fast_codes") {
        return {
          select: () => ({
            like: mockFastCodesLike,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
  tryGetSupabaseAdmin: () => null,
  disableSupabaseAdminClient: false,
}));

import { createMapSiteForAccount } from "../lib/mapsite-service";
import { completeRootAccountRegistration } from "../lib/root-account-registration-service";

describe("createMapSiteForAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMapsitesLike.mockResolvedValue({ data: [], error: null });
    mockFastCodesLike.mockResolvedValue({ data: [], error: null });
    mockMapsitesSelect.mockReturnValue({
      data: [],
      error: null,
    });
  });

  it("creates a draft MapSite linked to the account FAST Code", async () => {
    mockMapsitesInsert.mockResolvedValue({
      data: {
        id: "mapsite-1",
        fast_code: "ar01",
        account_id: "account-1",
        status: "draft",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const result = await createMapSiteForAccount({
      accountId: "account-1",
      fastCode: "AR01",
      accountType: "root",
      ownerFirstName: "Arun",
      ownerLastName: "Rachuri",
      email: "arun@example.com",
    });

    expect(result).toEqual({
      id: "mapsite-1",
      fastCode: "ar01",
      accountId: "account-1",
      status: "draft",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(mockMapsitesInsertPayload).toHaveBeenCalledOnce();
    const insertArg = mockMapsitesInsertPayload.mock.calls[0][0] as {
      fast_code: string;
      account_id: string;
      status: string;
    };
    expect(insertArg.fast_code).toBe("ar01");
    expect(insertArg.account_id).toBe("account-1");
    expect(insertArg.status).toBe("draft");
  });
});

describe("completeRootAccountRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersInsert.mockResolvedValue({
      data: {
        id: "user-1",
        name: "Arun Rachuri",
        email: "arun@example.com",
        phone: null,
        fast_code: null,
        role: "root",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });

    mockUsersUpdate.mockResolvedValue({ error: null });

    mockAccountsLike.mockResolvedValue({ data: [], error: null });
    mockMapsitesLike.mockResolvedValue({ data: [], error: null });
    mockFastCodesLike.mockResolvedValue({ data: [], error: null });

    mockAccountsInsert.mockResolvedValue({
      data: {
        id: "account-1",
        user_id: "user-1",
        account_type: "root",
        first_name: "Arun",
        middle_name: null,
        last_name: "Rachuri",
        fast_code: "ar01",
        email: "arun@example.com",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });

    mockMapsitesSelect.mockReturnValue({
      data: [],
      error: null,
    });

    mockMapsitesInsert.mockResolvedValue({
      data: {
        id: "mapsite-1",
        fast_code: "ar01",
        account_id: "account-1",
        status: "draft",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
  });

  it("creates user, root account, FAST Code, and MapSite in order", async () => {
    const result = await completeRootAccountRegistration({
      firstName: "Arun",
      lastName: "Rachuri",
      email: "arun@example.com",
    });

    expect(result).toEqual({
      userId: "user-1",
      accountId: "account-1",
      fastCode: "ar01",
      mapsiteId: "mapsite-1",
      redirectUrl: "/talispros/client/dashboard",
    });

    expect(mockUsersInsert).toHaveBeenCalled();
    expect(mockAccountsInsert).toHaveBeenCalled();
    expect(mockMapsitesInsert).toHaveBeenCalled();
    expect(mockUsersUpdate).toHaveBeenCalledWith("id", "user-1");
  });
});
