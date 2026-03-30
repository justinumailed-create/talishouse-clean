export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";
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

    // Use file storage if Supabase not configured
    if (!isSupabaseConfigured()) {
      const fastCode = generateFastCode(body.name);
      
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

    // Try Supabase first, fallback to file on error
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let useFileStorage = false;
    let newAssociate: any = null;

    try {
      const fastCode = generateFastCode(body.name);

      const payload = {
        name: body.name,
        email: body.email,
        fast_code: fastCode,
        slug: fastCode,
        role: "associate",
        role_type: "partner",
        is_page_enabled: true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseClient
        .from("users")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Supabase error, falling back to file:", error);
        useFileStorage = true;
      } else {
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
      }
    } catch (supabaseErr) {
      console.error("Supabase connection failed:", supabaseErr);
      useFileStorage = true;
    }

    // Fallback to file storage
    if (useFileStorage) {
      const fastCode = generateFastCode(body.name);
      const associates = getAssociates();
      newAssociate = {
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

      console.log("API HIT (file fallback):", body);
      return NextResponse.json({
        success: true,
        fastCode: newAssociate.fastCode,
        associate: newAssociate
      });
    }

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: "Server failed" },
      { status: 500 }
    );
  }
}
