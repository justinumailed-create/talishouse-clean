import { NextResponse } from "next/server";
import { getEditorBootstrap } from "@/lib/talismaps/pin-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bootstrap = await getEditorBootstrap();
    return NextResponse.json(bootstrap);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to bootstrap editor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
