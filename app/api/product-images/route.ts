import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({});
    }

    const { data, error } = await supabase
      .from("product_images")
      .select("size, type, image_url");

    if (error) {
      console.error("Error fetching product images:", error);
      return NextResponse.json({});
    }

    const imageMap: Record<string, string> = {};
    if (data) {
      data.forEach((img) => {
        imageMap[img.size] = img.image_url;
      });
    }

    return NextResponse.json(imageMap);
  } catch (err) {
    console.error("Product images API error:", err);
    return NextResponse.json({});
  }
}