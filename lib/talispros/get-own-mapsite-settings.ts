/**
 * Read/write the "Get your own Mapsite" flag in the existing GlobalContent
 * table. If the row (or table) is missing, the button stays on.
 */
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  GET_OWN_MAPSITE_FLAG_DEFAULT,
  GET_OWN_MAPSITE_FLAG_ID,
  parseGetOwnMapsiteFlag,
} from "@/lib/talispros/get-own-mapsite";

type GlobalContentClient = {
  from: (table: "GlobalContent") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { title?: string | null } | null;
          error: { message: string } | null;
        }>;
      };
    };
    upsert: (
      row: {
        id: string;
        title: string;
        summary: string;
        displayType: string;
        updated_at: string;
      },
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

function contentClient(): GlobalContentClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    return getSupabaseAdmin() as unknown as GlobalContentClient;
  } catch {
    return null;
  }
}

export async function getGetOwnMapsiteButtonEnabled(): Promise<boolean> {
  const client = contentClient();
  if (!client) return GET_OWN_MAPSITE_FLAG_DEFAULT;
  try {
    const { data, error } = await client
      .from("GlobalContent")
      .select("title")
      .eq("id", GET_OWN_MAPSITE_FLAG_ID)
      .maybeSingle();
    if (error) {
      console.warn("[get-own-mapsite] flag read failed:", error.message);
      return GET_OWN_MAPSITE_FLAG_DEFAULT;
    }
    return parseGetOwnMapsiteFlag(data?.title);
  } catch (error) {
    console.warn("[get-own-mapsite] flag unavailable:", error);
    return GET_OWN_MAPSITE_FLAG_DEFAULT;
  }
}

export async function setGetOwnMapsiteButtonEnabled(
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  const client = contentClient();
  if (!client) {
    return { ok: false, error: "Mapsite storage is not available." };
  }
  try {
    const { error } = await client.from("GlobalContent").upsert(
      {
        id: GET_OWN_MAPSITE_FLAG_ID,
        title: enabled ? "on" : "off",
        summary: "Show the Get your own Mapsite button on personal home pages.",
        displayType: "toggle",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) {
      console.warn("[get-own-mapsite] flag save failed:", error.message);
      return { ok: false, error: "Could not save the Get your own Mapsite toggle." };
    }
    return { ok: true, enabled };
  } catch (error) {
    console.warn("[get-own-mapsite] flag save exception:", error);
    return { ok: false, error: "Could not save the Get your own Mapsite toggle." };
  }
}
