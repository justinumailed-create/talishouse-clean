import { NextResponse } from "next/server";
import { createPinForMap, listPinsForMap } from "@/lib/talismaps/pin-engine";
import type { CreateTalisMapsPinInput } from "@/lib/talismaps/pin-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await context.params;
    const pins = await listPinsForMap(mapId);
    return NextResponse.json({ pins });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list pins";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await context.params;
    const body = (await request.json()) as CreateTalisMapsPinInput;
    const pin = await createPinForMap(mapId, body);
    return NextResponse.json({ pin }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
