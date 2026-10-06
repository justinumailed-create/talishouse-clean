import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOwnershipLearnMoreInquiry } from "@/lib/email";
import {
  OWNERSHIP_CONTACT_RECIPIENTS,
  OWNERSHIP_CONTACT_SOURCE,
  OWNERSHIP_CONTACT_TOPICS,
} from "@/lib/talispros/ownership-contact";
import { NANP_PHONE_ERROR, formatNanpPhone } from "@/lib/talispros/nanp-phone";

export const runtime = "nodejs";

function getLeadsClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables missing");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const rawPhone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();
  const topic = String(body.topic || "").trim();

  if (!name || !email || !rawPhone || !message || !topic) {
    return NextResponse.json(
      { ok: false, error: "Name, email, phone, and message are required." },
      { status: 400 },
    );
  }

  if (!OWNERSHIP_CONTACT_TOPICS.includes(topic as (typeof OWNERSHIP_CONTACT_TOPICS)[number])) {
    return NextResponse.json({ ok: false, error: "Unknown topic." }, { status: 400 });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }

  // North American (NANP) numbers only; stored as +1 (NPA) NXX-XXXX.
  const phone = formatNanpPhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: NANP_PHONE_ERROR }, { status: 400 });
  }

  try {
    const supabase = getLeadsClient();
    const { error: insertError } = await supabase.from("leads").insert([
      {
        name,
        email,
        phone,
        message,
        location: `Ownership Learn More — ${topic}`,
        fast_code: null,
        source: OWNERSHIP_CONTACT_SOURCE,
        status: "new",
      },
    ]);
    if (insertError) {
      console.error("[ownership-contact] lead insert failed:", insertError);
      return NextResponse.json(
        { ok: false, error: "Could not save your inquiry. Please try again." },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("[ownership-contact] lead save exception:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your inquiry. Please try again." },
      { status: 500 },
    );
  }

  const mail = await sendOwnershipLearnMoreInquiry({
    recipients: OWNERSHIP_CONTACT_RECIPIENTS,
    name,
    email,
    phone,
    topic,
    message,
  });

  if (!mail.sent) {
    console.warn("[ownership-contact] email not sent:", mail.error);
    // Lead is saved; still return ok so the visitor is not blocked when Resend is down.
    return NextResponse.json({
      ok: true,
      emailed: false,
      warning: mail.error || "Email delivery unavailable; inquiry saved for admin review.",
    });
  }

  return NextResponse.json({ ok: true, emailed: true });
}
