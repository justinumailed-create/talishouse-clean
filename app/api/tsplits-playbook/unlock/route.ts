import { NextResponse, type NextRequest } from "next/server";
import { TSPLITS_PLAYBOOK_COOKIE, TSPLITS_PLAYBOOK_PATH } from "@/lib/talisu/tsplits-playbook";
import {
  TSPLITS_PLAYBOOK_PRIVATE_HEADERS,
  redeemTsplitsPlaybookPasscode,
  requestIp,
  tsplitsPlaybookCookieOptions,
} from "@/lib/talisu/tsplits-playbook.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS = { badCode: 401, tooMany: 429, unavailable: 503 } as const;

/** POST /api/tsplits-playbook/unlock { passcode } → 12 h signed access cookie. */
export async function POST(request: NextRequest) {
  let passcode: unknown = "";
  const type = request.headers.get("content-type") ?? "";
  // Plain form posts (no JavaScript) are redirected back to the page.
  const isFormPost = !type.includes("application/json");
  try {
    if (!isFormPost) {
      passcode = ((await request.json()) as { passcode?: unknown } | null)?.passcode;
    } else {
      passcode = (await request.formData()).get("passcode");
    }
  } catch {
    passcode = "";
  }

  const result = await redeemTsplitsPlaybookPasscode({
    passcode: typeof passcode === "string" ? passcode.slice(0, 256) : "",
    ip: requestIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  if (isFormPost) {
    const to = new URL(TSPLITS_PLAYBOOK_PATH, request.url);
    if ("error" in result) to.searchParams.set("e", result.error);
    const res = NextResponse.redirect(to, { status: 303, headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
    if (!("error" in result)) {
      res.cookies.set(TSPLITS_PLAYBOOK_COOKIE, result.cookie, tsplitsPlaybookCookieOptions());
    }
    return res;
  }

  if ("error" in result) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: STATUS[result.error], headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS },
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: TSPLITS_PLAYBOOK_PRIVATE_HEADERS });
  res.cookies.set(TSPLITS_PLAYBOOK_COOKIE, result.cookie, tsplitsPlaybookCookieOptions());
  return res;
}
