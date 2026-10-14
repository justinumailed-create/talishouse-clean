"use client";

import { useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";
import { PMC_PATHS, pmcHref } from "@/lib/talispros/mapsite-contract";

export type AgentSignedClient = {
  id: string;
  fastCode: string | null;
  signerName: string;
  signerBusiness: string | null;
  signedAt: string;
};

const subscribe = () => () => {};

/** Agent dashboard: the agent's permanent code, its purpose, and their signed clients. */
export default function AgentContractCodeCard({
  code,
  clients,
}: {
  code: string | null;
  clients: AgentSignedClient[];
}) {
  const t = useT().pmc.agentCode;
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const shareUrl = code ? `${origin}${pmcHref(PMC_PATHS.talispros, { agent: code })}` : "";

  const copy = async (value: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <section
      data-testid="agent-contract-code"
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      <div className="bg-gradient-to-r from-[#06182f] to-[#0069CF] p-6 text-white">
        <h2 className="text-lg font-bold">{t.title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-white px-4 py-2 font-mono text-2xl font-black tracking-[0.2em] text-[#06182f]">
            {code ?? "—"}
          </span>
          {code ? (
            <button
              type="button"
              onClick={() => copy(code, "code")}
              className="rounded-full border border-white/40 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
            >
              {copied === "code" ? t.copied : t.copy}
            </button>
          ) : null}
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/85">{t.purpose}</p>
        {code ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{t.link}:</span>
            <code className="break-all rounded bg-white/10 px-2 py-1 text-[12px]">{shareUrl}</code>
            <button
              type="button"
              onClick={() => copy(shareUrl, "link")}
              className="rounded-full border border-white/40 px-3 py-1 text-[12px] font-semibold hover:bg-white/10"
            >
              {copied === "link" ? t.copied : t.copy}
            </button>
          </div>
        ) : null}
      </div>
      <div className="p-6">
        <h3 className="text-sm font-semibold text-neutral-900">{t.clients}</h3>
        {clients.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t.none}</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-[12px] uppercase text-neutral-500">
              <tr>
                <th className="py-1.5">FAST Code</th>
                <th className="py-1.5">Client</th>
                <th className="py-1.5">Signed</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="py-2 font-mono font-semibold">{c.fastCode?.toUpperCase() ?? "—"}</td>
                  <td className="py-2">
                    {c.signerName}
                    {c.signerBusiness ? <span className="text-neutral-500"> · {c.signerBusiness}</span> : null}
                  </td>
                  <td className="py-2 text-neutral-500">{new Date(c.signedAt).toLocaleString("en-CA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
