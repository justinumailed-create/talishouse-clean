export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAssociates, saveAssociates } from "@/lib/db";

function generateFastCode(name: string): string {
  const base = name.replace(/\s+/g, "").toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FAST-${base}${random}`;
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

    const fastCode = generateFastCode(body.name);

    if (!fastCode) {
      return NextResponse.json(
        { error: "FAST code required" },
        { status: 400 }
      );
    }

    // Use file storage if Supabase not configured
    if (!isSupabaseConfigured()) {
      const associates = getAssociates();
      const newAssociate = {
        id: Date.now().toString(),
        name: body.name,
        email: body.email,
        fastCode,
        createdAt: new Date().toISOString(),
        pageConfig: {
          heroType: "map",
          heroContent: "",
          headline: "TALISHOUSE™ HOMES",
          subtext: "",
          ctaText: "Propose a Project",
          showForm: false,
          showVideo: false,
          videoUrl: ""
        }
      };
      associates.push(newAssociate);
      saveAssociates(associates);

      console.log("API HIT (file):", body);
      return NextResponse.json({
        success: true,
        fastCode: newAssociate.fastCode,
        associate: newAssociate
      });
    }

    // Try Supabase first
    try {
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
          { error: error.message || "Failed to create associate in database" },
          { status: 500 }
        );
      }

      console.log("API HIT (supabase):", body);
      return NextResponse.json({
        success: true,
        fastCode: data.fast_code,
        associate: {
          id: data.id,
          name: data.name,
          email: data.email,
          fastCode: data.fast_code,
        }
      });
    } catch (supabaseErr) {
      console.error("Supabase connection failed:", supabaseErr);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: "Server failed" },
      { status: 500 }
    );
  }
}
