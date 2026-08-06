import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";

export interface TalisMapsPin {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryColor: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  featured: boolean;
  sortOrder: number;
}

export interface TalisMapsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  sortOrder: number;
}

export interface TalisMapsData {
  mapsite: {
    id: string;
    fastCode: string;
    slug: string;
    accountType: string;
    ownerFirstName: string;
    ownerLastName: string;
    email: string;
    phone: string;
    status: string;
  } | null;
  pins: TalisMapsPin[];
  categories: TalisMapsCategory[];
  notFound?: boolean;
  message?: string;
}

function normalizeColor(color: string): string {
  if (color.startsWith("#")) return color;
  if (color.startsWith("rgb")) return color;
  const named: Record<string, string> = {
    gold: "#F59E0B",
    green: "#22C55E",
    blue: "#3B82F6",
    red: "#EF4444",
  };
  return named[color.toLowerCase()] || color;
}

export async function getTalisMapsData(
  fastCode: string
): Promise<TalisMapsData> {
  const code = fastCode.trim();
  if (!code) {
    return { mapsite: null, pins: [], categories: [], notFound: true, message: "FAST code is required" };
  }

  const supabase = getSupabaseAdmin();

  const { data: mapsite } = await supabase
    .from("mapsites")
    .select("*")
    .ilike("fast_code", code)
    .maybeSingle();

  if (!mapsite) {
    return { mapsite: null, pins: [], categories: [], notFound: true, message: `Mapsite™ with code "${code}" not found` };
  }

  const [categoriesResult, pinsResult] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("pins").select("*, categories(name, slug)" as any).eq("mapsite_id", mapsite.id).order("sort_order"),
  ]);

  const categories: TalisMapsCategory[] = (categoriesResult.data || []).map(
    (c: Database["public"]["Tables"]["categories"]["Row"]) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      color: normalizeColor(c.color),
      description: c.description,
      sortOrder: c.sort_order,
    })
  );

  const defaultColors: Record<string, string> = {
    root: "#F59E0B",
    derivative: "#22C55E",
    adpro: "#3B82F6",
    featured: "#EF4444",
  };

  let rawPins: any[] = [];
  if (pinsResult.data) {
    rawPins = pinsResult.data;
  }

  const pins: TalisMapsPin[] = rawPins.map((p: any) => {
    const cat = p.categories as { name: string; slug: string } | null;
    const catSlug = cat?.slug || "";
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      categoryId: p.category_id || null,
      categorySlug: catSlug,
      categoryName: cat?.name || null,
      categoryColor: cat
        ? normalizeColor(
            categories.find((c) => c.slug === cat.slug)?.color ||
              defaultColors[cat.slug] ||
              "#6B7280"
          )
        : "#6B7280",
      latitude: p.latitude,
      longitude: p.longitude,
      address: p.address || "",
      city: p.city || "",
      province: p.province || "",
      postalCode: p.postal_code || "",
      country: p.country || "",
      website: p.website || "",
      phone: p.phone || "",
      email: p.email || "",
      featured: p.featured || false,
      sortOrder: p.sort_order || 0,
    };
  });

  return {
    mapsite: {
      id: mapsite.id,
      fastCode: mapsite.fast_code,
      slug: mapsite.slug,
      accountType: mapsite.account_type,
      ownerFirstName: mapsite.owner_first_name,
      ownerLastName: mapsite.owner_last_name,
      email: mapsite.email,
      phone: mapsite.phone || "",
      status: mapsite.status,
    },
    pins,
    categories,
  };
}
