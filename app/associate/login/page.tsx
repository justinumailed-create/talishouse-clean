import { redirect } from "next/navigation";
import { agentLoginPath, agentReturnFromSearchParams } from "@/lib/agent-return-path";

export const dynamic = "force-dynamic";

/** Legacy `/associate/login` → `/associate`, preserving a safe `?next=` return path. */
export default async function AssociateLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = agentReturnFromSearchParams(await searchParams);
  redirect(agentLoginPath(returnTo));
}
