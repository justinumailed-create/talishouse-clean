import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function generateFastCode(name: string): string {
  const base = name.replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const random = Math.floor(100 + Math.random() * 900);
  return `${base}${random}`;
}

async function checkFastCodeExists(fastCode: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("fast_code", fastCode)
    .maybeSingle();
  return !!data;
}

async function generateUniqueFastCode(name: string): Promise<string> {
  let fastCode = generateFastCode(name);
  let attempts = 0;
  while (await checkFastCodeExists(fastCode)) {
    fastCode = generateFastCode(name);
    attempts++;
    if (attempts > 10) {
      fastCode = "FAST-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      break;
    }
  }
  return fastCode;
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

    if (!isSupabaseConfigured()) {
      const mockFastCode = "FAST-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      return NextResponse.json({
        success: true,
        mock: true,
        associate: {
          id: "mock-" + Date.now(),
          name: body.name,
          email: body.email,
          fast_code: mockFastCode,
          slug: mockFastCode,
        }
      });
    }

    const fastCode = await generateUniqueFastCode(body.name);
    const slug = fastCode;

    const payload = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      fast_code: fastCode,
      slug: slug,
      role: "associate",
      role_type: body.role_type || "partner",
      intro_message: body.intro_message || null,
      video_url: body.video_url || null,
      page_headline: body.page_headline || `Partnered with ${body.name}`,
      page_subtext: body.page_subtext || null,
      page_contact_cta: body.page_contact_cta || null,
      page_footer_note: body.page_footer_note || null,
      page_custom_message: body.page_custom_message || null,
      is_page_enabled: true,
      images: [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
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
      associate: {
        id: data.id,
        name: data.name,
        email: data.email,
        fast_code: data.fast_code,
        slug: data.fast_code,
      }
    });

  } catch (err) {
    console.error("CREATE ASSOCIATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
