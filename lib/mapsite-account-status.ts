"use server";

import { cookies } from "next/headers";
import { MAPSITE_ROOT_ACCOUNT_COOKIE } from "./mapsite-account-session";
import { getSupabaseAdmin } from "./supabaseAdmin";

export interface MapSiteVisitorAccountStatus {
  hasSubscribed: boolean;
  fastCode: string | null;
  accountType: string | null;
}

export async function getMapSiteVisitorAccountStatus(): Promise<MapSiteVisitorAccountStatus> {
  const cookieStore = await cookies();
  const fastCode = cookieStore.get(MAPSITE_ROOT_ACCOUNT_COOKIE)?.value?.trim();

  if (!fastCode) {
    return { hasSubscribed: false, fastCode: null, accountType: null };
  }

  const supabase = getSupabaseAdmin();
  const { data: account } = await supabase
    .from("accounts")
    .select("fast_code, account_type")
    .ilike("fast_code", fastCode)
    .maybeSingle();

  if (!account) {
    return { hasSubscribed: true, fastCode, accountType: null };
  }

  return {
    hasSubscribed: true,
    fastCode: account.fast_code,
    accountType: account.account_type,
  };
}
