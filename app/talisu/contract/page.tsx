import Link from "next/link";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import PmcStepper from "@/components/talisu/pmc/PmcStepper";
import PmcFooter from "@/components/talisu/pmc/PmcFooter";
import LegalDocument from "@/components/talisu/pmc/LegalDocument";
import { ContractSignForm, ContractUnlockForm } from "@/components/talisu/pmc/ContractClient";
import { redirect } from "next/navigation";
import { readUnlockedContractAgent } from "@/app/talisu/contract/actions";
import { getSignedContractForFastCode } from "@/lib/talispros/mapsite-contract-service";
import { PMC_CLAIM_START, findClaimedMapSite, resolveVisitorFastCode } from "@/lib/talisu/pmc-gate";
import {
  PMC_PATHS,
  normalizeAgentCode,
  pmcHref,
} from "@/lib/talispros/mapsite-contract";
import {
  SERVICE_AGREEMENT_SIGNED,
  SERVICE_AGREEMENT_VERSION,
  SERVICE_AGREEMENT_ACCEPTANCE,
  SERVICE_AGREEMENT_INTRO,
  SERVICE_AGREEMENT_PROVIDER,
} from "@/lib/talisu/pmc-legal";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/talisu/contract");
}

type Props = { searchParams?: Promise<{ fastCode?: string; agent?: string }> };

export default async function PmcContractPage({ searchParams }: Props) {
  const locale = await getLocale();
  const t = getDictionary(locale).pmc;
  const params = (await searchParams) ?? {};
  // FAST Code is required: the signature ties to the visitor's claimed Mapsite.
  const claimed = await findClaimedMapSite(await resolveVisitorFastCode(params.fastCode));
  if (!claimed) redirect(PMC_CLAIM_START);
  const fastCode = claimed.fastCode;
  // Once signed for this FAST Code, never ask for an agent code again.
  const signed = await getSignedContractForFastCode(fastCode);
  const agent = signed ? null : await readUnlockedContractAgent();

  return (
    <div data-testid="pmc-contract" className="pmc-page">
      <section className="bg-gradient-to-br from-[#06182f] to-[#0069CF] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6">
          <PmcStepper current={3} labels={t.steps} fastCode={fastCode} tone="dark" />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.25em] text-[#9fd0ff]">{t.contract.kicker}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{t.contract.title}</h1>
          <p className="mt-3 text-white/80">TalisALL PMC · Appendix A</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {signed ? (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="font-semibold">
              ✓ {t.contract.alreadySigned}{" "}
              <span className="font-normal">
                ({signed.signerName}
                {signed.fastCode ? ` · ${signed.fastCode.toUpperCase()}` : ""} ·{" "}
                {t.contract.signedOn.replace(
                  "{date}",
                  new Date(signed.signedAt).toLocaleDateString(locale === "de" ? "de-CA" : "en-CA"),
                )}
                )
              </span>
            </p>
            <Link
              href={pmcHref(PMC_PATHS.register, { fastCode: signed.fastCode })}
              className="mt-3 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {t.contract.continue} →
            </Link>
          </div>
        ) : null}

        {signed ? null : !agent ? (
          <ContractUnlockForm fastCode={fastCode} initialCode={normalizeAgentCode(params.agent ?? "")} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
            <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black text-[#06182f]">Service Agreement</h2>
              <p className="mt-1 text-[12px] text-neutral-500">Version {SERVICE_AGREEMENT_VERSION}</p>
              <div className="mt-5 max-h-[70vh] overflow-y-auto pr-2">
                <LegalDocument sections={SERVICE_AGREEMENT_SIGNED} intro={SERVICE_AGREEMENT_INTRO} compact />
                <div className="mt-8 rounded-2xl bg-neutral-50 p-5 text-[14px] text-neutral-700">
                  <p className="font-bold text-neutral-900">Acceptance</p>
                  <p className="mt-1">{SERVICE_AGREEMENT_ACCEPTANCE}</p>
                  <p className="mt-4 font-bold uppercase tracking-wide text-neutral-900">{t.contract.provider}</p>
                  <p>Business: {SERVICE_AGREEMENT_PROVIDER.business}</p>
                  <p>Authorized Representative: {SERVICE_AGREEMENT_PROVIDER.representative}</p>
                  <p className="font-[cursive] text-2xl italic text-[#06182f]">{SERVICE_AGREEMENT_PROVIDER.representative}</p>
                  <p>Date: {SERVICE_AGREEMENT_PROVIDER.signedOn}</p>
                </div>
              </div>
            </article>
            <div className="lg:sticky lg:top-20 lg:self-start">
              <ContractSignForm agentName={agent.name} fastCode={fastCode} />
            </div>
          </div>
        )}
      </section>

      <PmcFooter
        labels={t}
        fastCode={fastCode}
        back={{ href: pmcHref(PMC_PATHS.mediaDirectory, { fastCode }) }}
      />
    </div>
  );
}
