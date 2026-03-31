import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("associates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET ASSOCIATES ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch associates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const fastCode = body.fastCode || "FAST-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const payload = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      fast_code: fastCode,
      is_page_enabled: true,
      page_headline: body.pageHeadline || `Partnered with ${body.name}`,
      page_subtext: body.pageSubtext || null,
      page_contact_cta: body.pageContactCta || "Propose a Project",
      page_footer_note: body.pageFooterNote || null,
      page_custom_message: body.pageCustomMessage || null,
      intro_message: body.introMessage || null,
      video_url: body.videoUrl || null,
      hero_type: "map",
      show_form: true,
      show_video: !!body.videoUrl,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("associates")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create associate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      associate: data
    });

  } catch (err) {
    console.error("CREATE ASSOCIATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
