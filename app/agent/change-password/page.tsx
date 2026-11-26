import { redirect } from "next/navigation";
import { agentChangePasswordPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export const dynamic = "force-dynamic";

/** Legacy `/agent/change-password` → `/associate/change-password`, preserving `?next=`. */
export default async function AgentChangePasswordRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = agentReturnFromSearchParams(await searchParams);
  redirect(agentChangePasswordPath(returnTo));
}
