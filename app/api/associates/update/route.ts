import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAssociates, saveAssociates } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "Associate ID required" }, { status: 400 });
    }

    const { id, updates } = body;

    // Use file storage if Supabase not configured
    if (!isSupabaseConfigured()) {
      const associates = getAssociates();
      const index = associates.findIndex((a: any) => a.id === id);

      if (index === -1) {
        return Response.json({ error: "Associate not found" }, { status: 404 });
      }

      const updated = {
        ...associates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      associates[index] = updated;
      saveAssociates(associates);

      return Response.json({ success: true, associate: updated });
    }

    // Supabase update
    try {
      // Map pageConfig to database columns if it exists
      let dbPayload: any = { ...updates };

      if (updates.pageConfig) {
        const config = updates.pageConfig;
        dbPayload = {
          ...dbPayload,
          hero_type: config.heroType,
          hero_content: config.heroContent,
          page_headline: config.headline,
          page_subtext: config.subtext,
          page_contact_cta: config.ctaText,
          show_form: config.showForm,
          show_video: config.showVideo,
          video_url: config.videoUrl
        };
        delete dbPayload.pageConfig;
      }

      const { data, error } = await supabase
        .from("associates")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, associate: data });
    } catch (supabaseErr) {
      console.error("Supabase connection failed:", supabaseErr);
      return Response.json({ error: "Database connection failed" }, { status: 500 });
    }

  } catch (err) {
    console.error("UPDATE API ERROR:", err);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}
