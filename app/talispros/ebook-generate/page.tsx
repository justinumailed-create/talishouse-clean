import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import EbookGenerateClient from "@/components/talispros/EbookGenerateClient";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** Image encode + storage uploads need more than the default serverless window. */
export const maxDuration = 60;

export const metadata: Metadata = createMetadata({
  title: "Generate E-Book | Talispros™",
  description:
    "Generate your own TalisBooks™ E-Book from property images, title, description, and location — no payment required.",
  path: "/talispros/ebook-generate",
  private: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type EbookGeneratePrefill = {
  agentName: string;
  agentEmail: string;
  agentPhone: string;
};

async function loadPrefill(input: {
  requestId: string | null;
  fastCode: string | null;
  mapsiteId: string | null;
}): Promise<EbookGeneratePrefill> {
  if (!isSupabaseAdminConfigured()) {
    return { agentName: "", agentEmail: "", agentPhone: "" };
  }

  const supabase = getSupabaseAdmin();

  let request: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    linked_mapsite_id: string | null;
  } | null = null;

  if (input.requestId) {
    const byRequest = await supabase
      .from("build_requests")
      .select("id, first_name, last_name, email, phone, linked_mapsite_id")
      .eq("id", input.requestId)
      .maybeSingle();
    request = byRequest.data;
  }

  if (!request && input.fastCode) {
    const byFastCode = await supabase
      .from("build_requests")
      .select("id, first_name, last_name, email, phone, linked_mapsite_id")
      .ilike("requested_fast_code", input.fastCode)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    request = byFastCode.data;
  }

  if (!request && input.mapsiteId) {
    const byMapsite = await supabase
      .from("build_requests")
      .select("id, first_name, last_name, email, phone, linked_mapsite_id")
      .eq("linked_mapsite_id", input.mapsiteId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    request = byMapsite.data;
  }

  const mapsiteId = input.mapsiteId || request?.linked_mapsite_id || null;
  let mapsite: {
    owner_first_name: string | null;
    owner_last_name: string | null;
    agent_name: string | null;
    email: string | null;
    phone: string | null;
  } | null = null;

  if (mapsiteId) {
    const mapsiteResult = await supabase
      .from("mapsites")
      .select("owner_first_name, owner_last_name, agent_name, email, phone")
      .eq("id", mapsiteId)
      .maybeSingle();
    mapsite = mapsiteResult.data;
  }

  const requestName = [request?.first_name, request?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const ownerName = [mapsite?.owner_first_name, mapsite?.owner_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    agentName: mapsite?.agent_name?.trim() || requestName || ownerName || "",
    agentEmail: request?.email?.trim() || mapsite?.email?.trim() || "",
    agentPhone: request?.phone?.trim() || mapsite?.phone?.trim() || "",
  };
}

export default async function EbookGeneratePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestId = firstParam(params.requestId)?.trim() || null;
  const fastCode = firstParam(params.fastCode)?.trim() || null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const prefill = await loadPrefill({
    requestId,
    fastCode,
    mapsiteId,
  });

  return (
    <EbookGenerateClient
      fastCode={fastCode}
      mapsiteId={mapsiteId}
      accountType={firstParam(params.accountType)?.trim() || null}
      requestId={requestId}
      initialAgentName={prefill.agentName}
      initialAgentEmail={prefill.agentEmail}
      initialAgentPhone={prefill.agentPhone}
    />
  );
}
