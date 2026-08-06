import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function findFastCodesByPrefix(prefix: string): Promise<string[]> {
  const normalizedPrefix = prefix.toLowerCase();
  const supabase = getSupabaseAdmin();

  const [accountsResult, registrationsResult, mapsitesResult, fastCodesResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("fast_code")
        .like("fast_code", `${normalizedPrefix}%`),
      supabase
        .from("fast_code_registrations")
        .select("fast_code")
        .like("fast_code", `${normalizedPrefix}%`),
      supabase
        .from("mapsites")
        .select("fast_code")
        .like("fast_code", `${normalizedPrefix}%`),
      supabase
        .from("fast_codes")
        .select("code")
        .like("code", `${normalizedPrefix}%`),
    ]);

  if (accountsResult.error) {
    throw new Error(
      `Failed to query account FAST Codes: ${accountsResult.error.message}`
    );
  }

  if (registrationsResult.error) {
    throw new Error(
      `Failed to query registration FAST Codes: ${registrationsResult.error.message}`
    );
  }

  if (mapsitesResult.error) {
    throw new Error(
      `Failed to query Mapsite™ FAST Codes: ${mapsitesResult.error.message}`
    );
  }

  if (fastCodesResult.error) {
    throw new Error(
      `Failed to query FAST Code records: ${fastCodesResult.error.message}`
    );
  }

  const codes = new Set<string>();

  for (const row of accountsResult.data ?? []) {
    if (row.fast_code) codes.add(row.fast_code.toLowerCase());
  }

  for (const row of (registrationsResult.data ?? []) as Array<{
    fast_code: string | null;
  }>) {
    if (row.fast_code) codes.add(row.fast_code.toLowerCase());
  }

  for (const row of mapsitesResult.data ?? []) {
    if (row.fast_code) codes.add(row.fast_code.toLowerCase());
  }

  for (const row of fastCodesResult.data ?? []) {
    if (row.code) codes.add(row.code.toLowerCase());
  }

  return [...codes];
}
