import { NextResponse, type NextRequest } from "next/server";
import {
  TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
  hasTsplitsPlaybookAccess,
  readTsplitsPlaybookHtml,
} from "@/lib/talisu/tsplits-playbook.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/tsplits-playbook/view — the playbook HTML (framed by
 * /talisu/tsplits-playbook), only with a valid access cookie.
 */
export async function GET(request: NextRequest) {
  if (!hasTsplitsPlaybookAccess(request.cookies)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
  }

  let html: string;
  try {
    html = await readTsplitsPlaybookHtml();
  } catch {
    console.error("[api/tsplits-playbook/view] file missing");
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      ...TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
