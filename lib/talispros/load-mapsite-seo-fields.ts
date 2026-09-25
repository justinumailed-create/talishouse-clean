import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export type MapsiteSeoFields = {
  fastCode: string;
  propertyTitle: string | null;
  propertyDescription: string | null;
  propertyAddress: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

/**
 * Thin Mapsite™ row for generateMetadata — real titles/addresses, no full view load.
 */
export async function loadMapsiteSeoFields(
  fastCode: string,
): Promise<MapsiteSeoFields | null> {
  const code = fastCode.trim();
  if (!code || !isSupabaseAdminConfigured()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("mapsites")
      .select(
        "fast_code, property_title, property_description, property_address, meta_title, meta_description, agent_name, owner_first_name, owner_last_name",
      )
      .ilike("fast_code", code)
      .maybeSingle();
    if (error || !data) return null;
    const ownerName = [data.owner_first_name, data.owner_last_name]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" ");
    const propertyTitle =
      (typeof data.property_title === "string" && data.property_title.trim()) ||
      (typeof data.agent_name === "string" && data.agent_name.trim()) ||
      ownerName ||
      null;
    return {
      fastCode: (data.fast_code || code).trim(),
      propertyTitle,
      propertyDescription:
        typeof data.property_description === "string"
          ? data.property_description.trim() || null
          : null,
      propertyAddress:
        typeof data.property_address === "string"
          ? data.property_address.trim() || null
          : null,
      metaTitle:
        typeof data.meta_title === "string"
          ? data.meta_title.trim() || null
          : null,
      metaDescription:
        typeof data.meta_description === "string"
          ? data.meta_description.trim() || null
          : null,
    };
  } catch (error) {
    console.warn(
      "[seo] Mapsite™ fields failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
