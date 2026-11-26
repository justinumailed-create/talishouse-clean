import { redirect } from "next/navigation";
import { agentLoginPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export const dynamic = "force-dynamic";

/** Legacy `/agent/login` → `/associate`, preserving a safe `?next=` return path. */
export default async function AgentLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = agentReturnFromSearchParams(await searchParams);
  redirect(agentLoginPath(returnTo));
}
