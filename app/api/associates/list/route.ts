export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("associates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in LIST API:", error);
      return Response.json([]);
    }

    // Map to camelCase and reconstruct pageConfig for UI compatibility
    const mapped = (data || []).map(a => ({
      ...a,
      fastCode: a.fast_code,
      createdAt: a.created_at,
      pageConfig: {
        heroType: a.hero_type || "map",
        heroContent: a.hero_content || "",
        headline: a.page_headline || "",
        subtext: a.page_subtext || "",
        ctaText: a.page_contact_cta || "Propose a Project",
        showForm: a.show_form || false,
        showVideo: a.show_video || false,
        videoUrl: a.video_url || ""
      }
    }));

    return Response.json(mapped);
  } catch (err) {
    console.error("LIST API ERROR:", err);
    return Response.json([], { status: 200 });
  }
}
