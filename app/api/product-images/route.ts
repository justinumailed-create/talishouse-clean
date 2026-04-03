import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 0;

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({});
    }

    const { data, error } = await supabase
      .from("product_images")
      .select("size, image_url");

    if (error) {
      console.error("Error fetching product images:", error);
      return NextResponse.json({});
    }

    const imageMap: Record<string, string> = {};
    if (data) {
      data.forEach((img) => {
        if (img.image_url) {
          const timestamp = Date.now();
          imageMap[img.size] = `${img.image_url}?t=${timestamp}`;
        }
      });
    }

    return NextResponse.json(imageMap, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (err) {
    console.error("Product images API error:", err);
    return NextResponse.json({});
  }
}