import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import RegisterAgentsClient from "@/components/talispros/RegisterAgentsClient";
import { REGISTER_AGENTS_PATH } from "@/lib/talispros/register-agents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Register Your Agents | Talispros™",
  description:
    "After Root Account™ payment, register Derivative Account™ agents under your FAST Code™.",
  path: REGISTER_AGENTS_PATH,
  private: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterAgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fastCode = firstParam(params.fastCode)?.trim() || null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const audience = firstParam(params.audience)?.trim() || null;

  return (
    <RegisterAgentsClient
      fastCode={fastCode}
      mapsiteId={mapsiteId}
      audience={audience}
    />
  );
}
