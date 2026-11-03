import { NextResponse, type NextRequest } from "next/server";
import { resolveSlotMapsiteHref } from "@/lib/talispros/fast-code-slots-server";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

export const dynamic = "force-dynamic";

/** A town on the demo Mapsite panel: look up the slot on the server and open its Mapsite. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> },
) {
  const { slotId } = await params;
  const href = await resolveSlotMapsiteHref(slotId);
  const target = new URL(href || DEMO_MAPSITE_BUILD_PATH, request.url);
  const res = NextResponse.redirect(target, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
