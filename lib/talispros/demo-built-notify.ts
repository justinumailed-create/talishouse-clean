import { sendDemoBuiltNotification } from "@/lib/email";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  countryFromCoordinates,
  demoFollowUpAgent,
  parseDemoRegion,
  type DemoRegion,
} from "@/lib/talispros/demo-built-region";

/** Always told when a Build Demo is created (Ralf, Oct 17 2026). */
export const DEMO_BUILT_TEAM_EMAILS = ["arun@kyptronix.com"] as const;

export type DemoBuiltEvent = {
  code: string;
  propertyTitle: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  mapsiteHref: string;
};

/** Optional extra recipients (comma separated), e.g. Ralf or a shared inbox. */
function envRecipients(): string[] {
  return (process.env.DEMO_NOTIFY_EMAILS || "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
}

/** Active agent (agent_admins) by first name, if they have an email on file. */
async function agentEmail(name: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const { data } = await (getSupabaseAdmin() as unknown as import("@supabase/supabase-js").SupabaseClient)
      .from("agent_admins")
      .select("email, status")
      .ilike("name", `${name}%`)
      .limit(3);
    const rows = (data || []) as { email: string | null; status: string | null }[];
    const row = rows.find((r) => r.email && (r.status || "active") === "active");
    return row?.email?.trim() || null;
  } catch {
    return null;
  }
}

export function resolveDemoRegion(event: Pick<DemoBuiltEvent, "streetAddress" | "latitude" | "longitude">): DemoRegion {
  const parsed = parseDemoRegion(event.streetAddress);
  if (parsed.country) return parsed;
  return { ...parsed, country: countryFromCoordinates(event.latitude, event.longitude) };
}

/**
 * Email the team that a demo was built and where. Never throws (the demo is
 * already built); returns what happened for logs/tests.
 */
export async function notifyDemoBuilt(event: DemoBuiltEvent): Promise<{
  sent: boolean;
  recipients: string[];
  region: DemoRegion;
  followUp: string | null;
  error?: string;
}> {
  const region = resolveDemoRegion(event);
  const followUp = demoFollowUpAgent(region.country);
  const followUpEmail = followUp ? await agentEmail(followUp) : null;
  const recipients = [
    ...new Set([...DEMO_BUILT_TEAM_EMAILS, ...envRecipients(), ...(followUpEmail ? [followUpEmail] : [])]),
  ];
  try {
    const result = await sendDemoBuiltNotification({
      recipients,
      ...event,
      country: region.country,
      region: region.region,
      followUp,
      followUpHasEmail: Boolean(followUpEmail),
    });
    if (!result.sent) console.warn("[demo-built] email not sent:", result.error);
    return { sent: result.sent, recipients, region, followUp, error: result.error };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[demo-built] notify failed:", message);
    return { sent: false, recipients, region, followUp, error: message };
  }
}
