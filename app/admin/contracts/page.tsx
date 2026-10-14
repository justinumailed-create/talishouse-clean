import Link from "next/link";
import { adminMetadata } from "@/lib/seo/page-metadata";
import { getAdminSessionAccount, requireAdminPage } from "@/lib/admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { CONTRACT_BUCKET, listSignedContracts } from "@/lib/talispros/mapsite-contract-service";
import { PMC_PATHS } from "@/lib/talispros/mapsite-contract";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata("Contracts");
}

type AgentRow = { id: string; name: string; login_id: string; contract_code: string | null; status: string };

/** CRM view: signed Service Agreements (clients) with the agent each belongs to. */
export default async function AdminContractsPage() {
  await requireAdminPage();
  const account = await getAdminSessionAccount();
  const agentScope = account?.access === "agent" ? account.agentId ?? "none" : null;

  const signed = await listSignedContracts({ agentId: agentScope, limit: 500 });
  let agents: AgentRow[] = [];
  const recordLinks = new Map<string, string>();
  if (isSupabaseAdminConfigured()) {
    const sb = getSupabaseAdmin() as unknown as import("@supabase/supabase-js").SupabaseClient;
    let q = sb.from("agent_admins").select("id, name, login_id, contract_code, status").order("name");
    if (agentScope) q = q.eq("id", agentScope);
    const { data } = await q;
    agents = (data as AgentRow[] | null) ?? [];
    const paths = signed.map((s) => s.recordPath).filter((p): p is string => Boolean(p));
    if (paths.length) {
      const { data: urls } = await sb.storage.from(CONTRACT_BUCKET).createSignedUrls(paths, 60 * 30);
      for (const u of urls ?? []) if (u.path && u.signedUrl) recordLinks.set(u.path, u.signedUrl);
    }
  }
  const countByAgent = new Map<string, number>();
  for (const s of signed) if (s.agentId) countByAgent.set(s.agentId, (countByAgent.get(s.agentId) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Contracts</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Clients unlock the Service Agreement at{" "}
          <Link href={PMC_PATHS.contract} className="text-[#1E4ED8] underline" target="_blank">
            {PMC_PATHS.contract}
          </Link>{" "}
          with their agent&apos;s permanent agent code. Every signature (and its FAST Code) is attributed to that agent.
          Registration payment requires a signed agreement.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Agent codes</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-[12px] uppercase text-neutral-500">
            <tr>
              <th className="py-1.5">Agent</th>
              <th className="py-1.5">Agent code</th>
              <th className="py-1.5">Status</th>
              <th className="py-1.5 text-right">Signed clients</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-neutral-100">
                <td className="py-2">
                  {a.name} <span className="text-neutral-400">({a.login_id})</span>
                </td>
                <td className="py-2 font-mono font-semibold">{a.contract_code ?? "—"}</td>
                <td className="py-2 text-neutral-500">{a.status}</td>
                <td className="py-2 text-right">{countByAgent.get(a.id) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Signed Service Agreements</h2>
        {signed.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No signed contracts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="admin-contracts-table">
              <thead className="text-[12px] uppercase text-neutral-500">
                <tr>
                  <th className="py-1.5 pr-3">Signed</th>
                  <th className="py-1.5 pr-3">FAST Code</th>
                  <th className="py-1.5 pr-3">Client</th>
                  <th className="py-1.5 pr-3">Business</th>
                  <th className="py-1.5 pr-3">Email</th>
                  <th className="py-1.5 pr-3">Agent</th>
                  <th className="py-1.5">Record</th>
                </tr>
              </thead>
              <tbody>
                {signed.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-100">
                    <td className="py-2 pr-3 text-neutral-500">{new Date(s.signedAt).toLocaleString("en-CA")}</td>
                    <td className="py-2 pr-3 font-mono font-semibold">
                      {s.fastCode ? (
                        <Link href={`/admin/mapsites/${s.fastCode}`} className="text-[#1E4ED8] hover:underline">
                          {s.fastCode.toUpperCase()}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3">{s.signerName}</td>
                    <td className="py-2 pr-3">{s.signerBusiness ?? "—"}</td>
                    <td className="py-2 pr-3">{s.signerEmail ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {s.agentName ?? "—"}
                      {s.agentCode ? <span className="ml-1 font-mono text-[12px] text-neutral-400">{s.agentCode}</span> : null}
                    </td>
                    <td className="py-2">
                      {s.recordPath && recordLinks.get(s.recordPath) ? (
                        <a href={recordLinks.get(s.recordPath)} target="_blank" rel="noopener noreferrer" className="text-[#1E4ED8] underline">
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
