import { NextResponse } from "next/server";
import { listNavMapSites } from "@/lib/talisu/nav-mapsites";

export const dynamic = "force-dynamic";

/** Public nav payload for the blue header Mapsites dropdown. */
export async function GET() {
  const payload = await listNavMapSites();
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  });
}
