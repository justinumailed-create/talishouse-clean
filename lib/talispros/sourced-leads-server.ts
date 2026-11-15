import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  canadaSourcedDay,
  countsByDay,
  type SourcedLead,
  type SourcedLeadCalendar,
} from "@/lib/talispros/canada-calendar";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export type { SourcedLead, SourcedLeadCalendar };

type QueueRow = {
  id?: string | null;
  brokerage?: string | null;
  town?: string | null;
  province?: string | null;
  created_at?: string | null;
};

/**
 * Sourced leads are rows in prospect_queue. created_at is the instant the
 * daily search stored the brokerage. The day is computed in Canada, not in
 * the viewer's timezone.
 */
export async function loadSourcedLeadCalendar(includeNames: boolean): Promise<SourcedLeadCalendar> {
  if (!isSupabaseAdminConfigured()) return { counts: [], leads: [] };
  const columns = includeNames ? "id, brokerage, town, province, created_at" : "created_at";
  const { data, error } = await db()
    .from("prospect_queue")
    .select(columns)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error || !data) return { counts: [], leads: [] };

  const leads: SourcedLead[] = [];
  const days: string[] = [];
  for (const row of data as QueueRow[]) {
    const sourcedAt = row.created_at?.trim() || "";
    const day = canadaSourcedDay(sourcedAt);
    if (!day) continue;
    days.push(day);
    if (!includeNames) continue;
    const id = row.id?.trim();
    const brokerage = row.brokerage?.trim();
    if (!id || !brokerage) continue;
    leads.push({
      id,
      brokerage,
      town: row.town?.trim() || "",
      province: row.province?.trim() || "",
      sourcedAt,
      day,
    });
  }
  return { counts: countsByDay(days), leads };
}
