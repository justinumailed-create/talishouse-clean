import { TALISU_DISCUSS_PATH, talisuHref } from "@/lib/talisu/talisu-links";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enforcePmcRegistrationGate, firstParam } from "@/lib/talisu/pmc-gate";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import RegisterStructureTabs from "@/components/talisu/RegisterStructureTabs";
import RegisterActions from "@/components/talisu/RegisterActions";
import { hasCheckoutAccess, hasRegisterEntry } from "@/lib/talisu/register-entry";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { PMC_PATHS } from "@/lib/talispros/mapsite-contract";
import { isTalisURegisterCheckoutStep } from "@/lib/talisu/ask-step";
import {
  REGISTER_STRUCTURE_COOKIE,
  normalizeRegisterLockReason,
  parseSingleRegisterStructure,
  registerLockedHref,
  registerStructureCheckoutUrl,
  talisURegisterStructureHref,
} from "@/lib/talisu/register-structure";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuRegister;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/reg",
    locale,
    // Dedicated share card (Aisha + tree logo), not the shared brand card.
    image: {
      url: m.ogImage,
      width: 1200,
      height: 630,
      alt: m.ogImageAlt,
    },
  });
}

type TalisURegisterPageProps = {
  searchParams?: Promise<{
    step?: string | string[];
    fastCode?: string | string[];
    structure?: string | string[];
    locked?: string | string[];
    product?: string | string[];
  }>;
};

/** Structure step, opened after a valid agent entry code. */
const REGISTER_CHOOSE_STEP = "choose";
const REGISTER_ENTRY_LOCK = "code";

/** Where a register URL without a valid agent entry goes back to. */
function registerEntryLockedHref(fastCode?: string | null): string {
  const params = new URLSearchParams({ locked: REGISTER_ENTRY_LOCK });
  const code = fastCode?.trim();
  if (code) params.set("fastCode", code);
  return `/talisu/reg?${params.toString()}`;
}

export default async function TalisURegisterPage({
  searchParams,
}: TalisURegisterPageProps) {
  const TALISU_REGISTER = getDictionary(await getLocale()).talisu.register;
  const params = (await searchParams) ?? {};

  // Selected structure (Oct 26): exactly one of the four ids, from
  // ?structure=<id>. The landing loads with none selected unless the URL
  // names one (an older remembered choice is ignored there).
  const urlStructure = parseSingleRegisterStructure(params.structure);

  // Register entry (Oct 31): registration needs an entry code issued by an
  // agent, checked server-side (lib/talisu/register-entry.ts). Without it the
  // structure step and the SamCart checkout are never rendered.
  const entryGranted = await hasRegisterEntry();
  const checkoutGranted = await hasCheckoutAccess();
  const step = firstParam(params.step)?.trim().toLowerCase() ?? "";
  const lockedParam = firstParam(params.locked)?.trim().toLowerCase() ?? "";
  const nextProduct = firstParam(params.product)?.trim().toLowerCase() ?? null;

  if (!isTalisURegisterCheckoutStep(params.step)) {
    // Landing: Aisha's portrait + five SamCart checkouts, in this order:
    // Broker · Agent · FSBO · Adpro · PIN.
    const wantsStructures =
      step === REGISTER_CHOOSE_STEP ||
      params.structure !== undefined ||
      lockedParam === "structure";
    if (!entryGranted || !wantsStructures) {
      return (
        <AdviserLayout
          testId="talisu-register-landing"
          imageSrc={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
          imageAlt="Aisha, AMBA"
          imagePosition="center 20%"
          kicker={TALISU_REGISTER.adviserKicker}
          title={TALISU_REGISTER.adviserTitle}
        >
          <RegisterActions
            labels={TALISU_REGISTER.actions}
            entryGranted={checkoutGranted}
            nextProduct={nextProduct}
            initialOpen={wantsStructures || lockedParam === REGISTER_ENTRY_LOCK}
            hrefs={{
              propose: talisuHref(TALISU_DISCUSS_PATH),
              claim: DEMO_MAPSITE_BUILD_PATH,
              terms: PMC_PATHS.contract,
              register: `/talisu/reg?step=${REGISTER_CHOOSE_STEP}`,
            }}
          />
          <div className="mt-6 text-[13px] font-semibold text-neutral-900" data-testid="talisu-register-partner">
            {TALISU_REGISTER.partnerName}
          </div>
        </AdviserLayout>
      );
    }

    // Structure step (entry accepted): the four single-select structure
    // tabs. "Register now" unlocks once one is chosen; the SamCart checkout
    // only renders after it (?step=register&structure=<id>).
    return (
      <AdviserLayout
        testId="talisu-register-landing"
        imageSrc={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
        imageAlt="Aisha, AMBA"
        imagePosition="center 20%"
        kicker={TALISU_REGISTER.adviserKicker}
        title={TALISU_REGISTER.adviserTitle}
      >
        <RegisterStructureTabs
          tabs={TALISU_REGISTER.structures}
          initialId={urlStructure}
          bouncedReason={normalizeRegisterLockReason(params.locked)}
          label={TALISU_REGISTER.structuresLabel}
          selectedLabel={TALISU_REGISTER.structureSelected}
          lockLabel={TALISU_REGISTER.lockNeedStructure}
          closeLabel={TALISU_REGISTER.structureClose}
          ctaLabel={TALISU_REGISTER.ctaLabel}
          ctaNote={TALISU_REGISTER.ctaNote}
        />
        <div className="mt-6 text-[13px] font-semibold text-neutral-900" data-testid="talisu-register-partner">
          {TALISU_REGISTER.partnerName}
        </div>
      </AdviserLayout>
    );
  }

  // Server side of the entry lock: no agent entry code, no checkout.
  if (!entryGranted) {
    redirect(registerEntryLockedHref(firstParam(params.fastCode)));
  }

  // Server side of the lock: the checkout needs exactly one valid structure.
  // A ?structure= that is a comma list or unknown goes back to the landing
  // (?locked=structure); only with no ?structure= at all is the choice
  // remembered on this page (cookie, one value) used.
  const cookieStore = await cookies();
  const structure =
    params.structure === undefined
      ? parseSingleRegisterStructure(cookieStore.get(REGISTER_STRUCTURE_COOKIE)?.value)
      : urlStructure;
  if (!structure) {
    redirect(registerLockedHref(firstParam(params.fastCode)));
  }
  const structureTab = TALISU_REGISTER.structures.find((s) => s.id === structure) ?? null;

  // PMC gate (every registrant): Demo → claim Mapsite → Tsplits™ → Media
  // Directory → Contract (agent code) → sign → here → payment. No claimed
  // Mapsite → demo/claim start; unsigned → the sequence. Paid users pass.
  await enforcePmcRegistrationGate(firstParam(params.fastCode));

  const checkoutUrl = registerStructureCheckoutUrl(TALISU_REGISTER.samcartUrl, structure);

  return (
    <SectionShell title={TALISU_REGISTER.title} maxWidthClass="max-w-[1920px]">
      {/* A narrow partner column leaves the SamCart iframe wide enough for its
          own two-column checkout at typical desktop widths (about 1280–1440px). */}
      <div className="mb-14 grid items-start gap-6 xl:grid-cols-[minmax(0,10.75rem)_minmax(0,1fr)] xl:gap-5">
        <div className="min-w-0 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <div className="mb-3 flex justify-center">
            <Image
              src={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
              alt="Aisha, AMBA"
              width={896}
              height={1200}
              className="h-auto w-full max-w-[108px] rounded-lg object-cover shadow-sm"
              sizes="108px"
              priority
            />
          </div>
          <h2 className="text-base font-semibold leading-snug text-[#0069CF]">
            {TALISU_REGISTER.partnerName}
          </h2>
          {structureTab ? (
            <div
              data-testid="register-structure"
              data-structure-id={structureTab.id}
              className="mt-4 rounded-xl border border-[#046BD9]/25 bg-[#EAF3FF] px-3 py-2.5 text-sm text-neutral-800"
            >
              <span className="font-semibold text-neutral-950">
                {TALISU_REGISTER.structureSelected}
              </span>{" "}
              {structureTab.label}
              {" · "}
              <Link
                href={talisURegisterStructureHref(structureTab.id)}
                className="font-semibold text-[#046BD9] underline-offset-2 hover:underline"
              >
                {TALISU_REGISTER.structureChange}
              </Link>
            </div>
          ) : null}
          <p className="mt-2 text-xs leading-snug text-neutral-700">
            {TALISU_REGISTER.partnerIntro}
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-snug text-neutral-600">
            {TALISU_REGISTER.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium text-[#0069CF]">
            {TALISU_REGISTER.closing}
          </p>
        </div>

        <div className="min-w-0">
          <SamCartEmbed
            key={checkoutUrl}
            src={checkoutUrl}
            title="TalisU Register — SamCart"
            height={1500}
          />
        </div>
      </div>
    </SectionShell>
  );
}
