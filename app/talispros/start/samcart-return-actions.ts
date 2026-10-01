"use server";

import { cookies } from "next/headers";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { establishPaidMapSiteBrowserSession } from "@/lib/mapsite-edit-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { normalizePaymentEmail } from "@/lib/talispros/mapsite-payment-status";
import {
  describeSamCartReturnVerification,
  isSamCartPaymentReturn,
  parseSamCartReturnParams,
  SAMCART_RETURN_COOKIE,
  SAMCART_RETURN_COOKIE_MAX_AGE,
  samcartExternalOrderKey,
  type SamCartReturnParams,
} from "@/lib/talispros/samcart-return";
import {
  buildClaimedMapSitePath,
} from "@/lib/talispros/mapsite-state";
import { resolveClaimedMapSiteAccountTypeSegment } from "@/app/talispros/mapsites/actions";

export type SamCartStartReturnResult = {
  detected: boolean;
  /** True only when webhook/API would confirm — always false on return-URL path. */
  chargeVerified: boolean;
  verificationNote: string;
  orderId: string | null;
  email: string | null;
  fastCode: string | null;
  mapsiteId: string | null;
  href: string | null;
  paymentRecorded: boolean;
  sessionEstablished: boolean;
  error?: string;
};

async function resolveMapSiteFromReturn(
  params: SamCartReturnParams,
): Promise<{
  fastCode: string | null;
  mapsiteId: string | null;
  email: string | null;
  requestId: string | null;
  planType: string | null;
}> {
  const empty = {
    fastCode: null as string | null,
    mapsiteId: null as string | null,
    email: params.email,
    requestId: null as string | null,
    planType: null as string | null,
  };

  if (!isSupabaseAdminConfigured()) return empty;

  const supabase = getSupabaseAdmin();

  if (params.fastCode) {
    const mapsite = await getMapSiteByFastCode(params.fastCode);
    if (mapsite) {
      return {
        fastCode: (mapsite.fastCode || params.fastCode).trim().toLowerCase(),
        mapsiteId: mapsite.id,
        email: normalizePaymentEmail(mapsite.email) || params.email,
        requestId: null,
        planType: null,
      };
    }
  }

  const email = normalizePaymentEmail(params.email);
  if (!email) return empty;

  const { data: mapsiteByEmail } = await supabase
    .from("mapsites")
    .select("id, fast_code, email")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mapsiteByEmail?.id) {
    return {
      fastCode: mapsiteByEmail.fast_code?.trim().toLowerCase() || null,
      mapsiteId: mapsiteByEmail.id,
      email,
      requestId: null,
      planType: null,
    };
  }

  const { data: request } = await supabase
    .from("build_requests")
    .select(
      "id, linked_mapsite_id, requested_fast_code, requested_account_type, account_type, email",
    )
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) return { ...empty, email };

  let mapsiteId = request.linked_mapsite_id?.trim() || null;
  let fastCode = request.requested_fast_code?.trim().toLowerCase() || null;

  if (mapsiteId && !fastCode) {
    const { data: ms } = await supabase
      .from("mapsites")
      .select("fast_code")
      .eq("id", mapsiteId)
      .maybeSingle();
    fastCode = ms?.fast_code?.trim().toLowerCase() || null;
  }

  if (!mapsiteId && fastCode) {
    const mapsite = await getMapSiteByFastCode(fastCode);
    mapsiteId = mapsite?.id || null;
  }

  const planType =
    request.requested_account_type || request.account_type || null;

  return {
    fastCode,
    mapsiteId,
    email,
    requestId: request.id,
    planType,
  };
}

/**
 * Handle SamCart Custom URL return on the homepage gate (`/`).
 * Sets return cookie + best-effort paid session / payment row.
 * Does NOT cryptographically verify the charge (webhook still required).
 */
export async function handleSamCartStartReturn(
  raw: Record<string, string | string[] | undefined>,
): Promise<SamCartStartReturnResult> {
  const params = parseSamCartReturnParams(raw);
  const base: SamCartStartReturnResult = {
    detected: false,
    chargeVerified: false,
    verificationNote: describeSamCartReturnVerification(),
    orderId: params.orderId,
    email: params.email,
    fastCode: params.fastCode,
    mapsiteId: null,
    href: null,
    paymentRecorded: false,
    sessionEstablished: false,
  };

  if (!isSamCartPaymentReturn(params) || !params.orderId) {
    return base;
  }

  base.detected = true;

  try {
    const cookieStore = await cookies();
    cookieStore.set(
      SAMCART_RETURN_COOKIE,
      JSON.stringify({
        orderId: params.orderId,
        email: params.email,
        at: new Date().toISOString(),
        verified: false,
      }),
      {
        path: "/",
        maxAge: SAMCART_RETURN_COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    );
  } catch (error) {
    console.warn("[samcart-return] Could not set return cookie:", error);
  }

  const resolved = await resolveMapSiteFromReturn(params);
  base.email = resolved.email || params.email;
  base.fastCode = resolved.fastCode;
  base.mapsiteId = resolved.mapsiteId;

  if (resolved.fastCode) {
    try {
      await establishPaidMapSiteBrowserSession(resolved.fastCode);
      base.sessionEstablished = true;
    } catch (error) {
      console.warn("[samcart-return] Could not establish paid session:", error);
    }

    try {
      const accountType = await resolveClaimedMapSiteAccountTypeSegment({
        fastCode: resolved.fastCode,
        mapsiteId: resolved.mapsiteId,
      });
      base.href = buildClaimedMapSitePath({
        fastCode: resolved.fastCode,
        accountType,
      });
    } catch {
      /* href optional */
    }
  }

  if (
    isSupabaseAdminConfigured() &&
    (resolved.email || resolved.mapsiteId || resolved.fastCode)
  ) {
    try {
      const supabase = getSupabaseAdmin();
      const externalKey = samcartExternalOrderKey(params.orderId);
      const email =
        normalizePaymentEmail(resolved.email) ||
        normalizePaymentEmail(params.email) ||
        "samcart-return@talispros.local";

      const { data: existing } = await supabase
        .from("talispros_payments")
        .select("id, payment_status")
        .eq("paypal_order_id", externalKey)
        .maybeSingle();

      if (existing?.id) {
        base.paymentRecorded = true;
      } else {
        const { error } = await supabase.from("talispros_payments").insert({
          email,
          plan_type: resolved.planType || "ROOT_ACCOUNT",
          paypal_order_id: externalKey,
          payment_provider: "samcart",
          payment_status: "completed",
          ...(resolved.mapsiteId ? { mapsite_id: resolved.mapsiteId } : {}),
          ...(resolved.requestId ? { request_id: resolved.requestId } : {}),
          ...(resolved.fastCode ? { fast_code: resolved.fastCode } : {}),
        });
        if (error) {
          console.warn(
            "[samcart-return] payment upsert failed (unverified return path):",
            error.message,
          );
        } else {
          base.paymentRecorded = true;
        }
      }

      if (resolved.mapsiteId) {
        await supabase
          .from("mapsites")
          .update({
            status: "active",
            interest_form_enabled: true,
          })
          .eq("id", resolved.mapsiteId);
      }
    } catch (error) {
      console.warn("[samcart-return] payment record failed:", error);
    }
  }

  return base;
}
