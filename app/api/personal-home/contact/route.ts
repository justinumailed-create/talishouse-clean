import { NextResponse } from "next/server";
import {
  allowContactReveal,
  isSameOriginRequest,
  parseContactRevealBody,
  requestClientIp,
} from "@/lib/talispros/personal-home-contact";
import { lookupPublicContactValue } from "@/lib/talispros/personal-home-contact-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Click-to-reveal a single public contact field (phone or email) for a
 * member personal home page or Mapsite. One field only. Same-origin and
 * per-IP rate limited. Never returns both fields together.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const ip = requestClientIp(request.headers);
  if (!allowContactReveal(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limit" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const input = parseContactRevealBody(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const value = await lookupPublicContactValue(input);
  if (!value) {
    return NextResponse.json({ ok: false, error: "missing" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, field: input.field, value });
}
