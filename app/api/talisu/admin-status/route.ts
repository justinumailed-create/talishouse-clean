import { NextResponse } from "next/server";
import { getAdminSessionAccount } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Header helper: does this browser hold a signed-in admin session
 * (Global Admin, granted admin, or Agent Admin)? Returns only a boolean —
 * never the account, FAST Code, or session details. Used to show the
 * admin-only Markets row in the TalisU dropdown.
 */
export async function GET() {
  let admin = false;
  try {
    admin = Boolean(await getAdminSessionAccount());
  } catch {
    admin = false;
  }
  return NextResponse.json(
    { admin },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
