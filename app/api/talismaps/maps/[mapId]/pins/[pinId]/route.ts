import { NextResponse } from "next/server";
import {
  deletePinForMap,
  getPinForMap,
  updatePinForMap,
} from "@/lib/talismaps/pin-engine";
import type { UpdateTalisMapsPinInput } from "@/lib/talismaps/pin-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ mapId: string; pinId: string }> }
) {
  try {
    const { mapId, pinId } = await context.params;
    const pin = await getPinForMap(mapId, pinId);
    if (!pin) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }
    return NextResponse.json({ pin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ mapId: string; pinId: string }> }
) {
  try {
    const { mapId, pinId } = await context.params;
    const body = (await request.json()) as UpdateTalisMapsPinInput;
    const pin = await updatePinForMap(mapId, pinId, body);
    return NextResponse.json({ pin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ mapId: string; pinId: string }> }
) {
  try {
    const { mapId, pinId } = await context.params;
    await deletePinForMap(mapId, pinId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
