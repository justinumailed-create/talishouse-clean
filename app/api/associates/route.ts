import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("associates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Associates fetch error:", error);
      return Response.json([], { status: 200 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return Response.json([], { status: 200 });
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

    if (!fastCode) {
      return NextResponse.json(
        { error: "FAST code required" },
        { status: 400 }
      );
    }

    const payload = {
      fast_code: fastCode,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      footer_note: body.footerNote || null,
      custom_message: body.customMessage || null,
      video_url: body.videoUrl || null,
    };

    console.log("Creating associate:", payload);

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
