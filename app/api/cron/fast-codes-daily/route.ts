import { NextRequest, NextResponse } from "next/server";
import { runFastCodeDailyJob } from "@/lib/talispros/fast-code-daily-job";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel cron, 00:30 UTC (06:00 IST): refresh prospect FAST Codes and auto-assign approved prospects. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runFastCodeDailyJob("cron");
  return NextResponse.json({ ok: true, summary });
}
