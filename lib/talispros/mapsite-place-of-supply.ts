import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  parseCanadaProvince,
  resolvePlaceOfSupplyProvince,
  type CanadaProvinceCode,
} from "@/lib/canada-sales-tax";

async function safeLookup<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

/**
 * Place of supply for Mapsite™ activation: claimed market / property
 * province, then any client-selected province. Never invents a default rate.
 */
export async function resolveMapSitePlaceOfSupply(options: {
  mapsiteId: string;
  requestId?: string | null;
  selectedProvince?: string | null;
}): Promise<CanadaProvinceCode | null> {
  const selected = parseCanadaProvince(options.selectedProvince);
  if (selected) return selected;
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const mapsiteId = options.mapsiteId.trim();
  const requestId = options.requestId?.trim() || null;

  const [mapsite, pins, request] = await Promise.all([
    safeLookup(
      async () => {
        const { data } = await supabase
          .from("mapsites")
          .select("property_address")
          .eq("id", mapsiteId)
          .maybeSingle();
        return data;
      },
      null,
    ),
    safeLookup(
      async () => {
        const { data } = await supabase
          .from("pins")
          .select("province, city, address, country")
          .eq("mapsite_id", mapsiteId)
          .limit(8);
        return data ?? [];
      },
      [] as Array<{
        province?: string | null;
        city?: string | null;
        address?: string | null;
        country?: string | null;
      }>,
    ),
    requestId
      ? safeLookup(
          async () => {
            const { data } = await supabase
              .from("build_requests")
              .select("street_address, reverse_geocoded_address, address")
              .eq("id", requestId)
              .maybeSingle();
            return data;
          },
          null,
        )
      : Promise.resolve(null),
  ]);

  return resolvePlaceOfSupplyProvince(
    ...pins.map((pin) => pin.province),
    mapsite?.property_address,
    request?.street_address,
    request?.reverse_geocoded_address,
    request?.address,
    ...pins.map((pin) => pin.address),
    ...pins.map((pin) =>
      [pin.city, pin.province, pin.country].filter(Boolean).join(", "),
    ),
  );
}
