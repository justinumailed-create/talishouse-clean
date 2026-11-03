import { NextResponse, type NextRequest } from "next/server";
import {
  TSPLITS_PLAYBOOK_PATH,
  TSPLITS_PLAYBOOK_PDF_FILE_NAME,
} from "@/lib/talisu/tsplits-playbook";
import {
  TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
  hasTsplitsPlaybookAccess,
  readTsplitsPlaybookPdf,
} from "@/lib/talisu/tsplits-playbook.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/tsplits-playbook/pdf — the playbook PDF, only with a valid access cookie. */
export async function GET(request: NextRequest) {
  if (!hasTsplitsPlaybookAccess(request.cookies)) {
    // Browsers go back to the passcode form; everything else gets a plain 401.
    if ((request.headers.get("accept") ?? "").includes("text/html")) {
      return NextResponse.redirect(new URL(TSPLITS_PLAYBOOK_PATH, request.url), {
        status: 303,
        headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
      });
    }
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
  }

  let bytes: Buffer;
  try {
    bytes = await readTsplitsPlaybookPdf();
  } catch {
    console.error("[api/tsplits-playbook/pdf] file missing");
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      ...TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${TSPLITS_PLAYBOOK_PDF_FILE_NAME}"`,
    },
  });
}
