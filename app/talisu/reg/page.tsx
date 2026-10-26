import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enforcePmcRegistrationGate, firstParam } from "@/lib/talisu/pmc-gate";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import RegisterStructureTabs from "@/components/talisu/RegisterStructureTabs";
import { isTalisURegisterCheckoutStep } from "@/lib/talisu/ask-step";
import {
  REGISTER_STRUCTURE_COOKIE,
  normalizeRegisterLockReason,
  parseRegisterStructures,
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
  }>;
};

export default async function TalisURegisterPage({
  searchParams,
}: TalisURegisterPageProps) {
  const TALISU_REGISTER = getDictionary(await getLocale()).talisu.register;
  const params = (await searchParams) ?? {};

  // Selected structures (Oct 26): one or more of the four ids, from
  // ?structure=a,b. The landing loads with none selected unless the URL
  // names some (an older remembered choice is ignored there).
  const urlStructures = parseRegisterStructures(params.structure);

  // Adviser landing first: Aisha's portrait + the four structure toggles.
  // "Register now" unlocks with at least one structure; the SamCart register
  // checkout only renders after it (?step=register&structure=a,b).
  if (!isTalisURegisterCheckoutStep(params.step)) {
    return (
      <AdviserLayout
        testId="talisu-register-landing"
        imageSrc={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
        imageAlt="Aisha C."
        imagePosition="center 20%"
        kicker={TALISU_REGISTER.adviserKicker}
        title={TALISU_REGISTER.adviserTitle}
      >
        <RegisterStructureTabs
          tabs={TALISU_REGISTER.structures}
          initialIds={urlStructures}
          bouncedReason={normalizeRegisterLockReason(params.locked)}
          label={TALISU_REGISTER.structuresLabel}
          selectedLabel={TALISU_REGISTER.structureSelected}
          selectedPluralLabel={TALISU_REGISTER.structuresSelected}
          lockLabel={TALISU_REGISTER.lockNeedStructure}
          closeLabel={TALISU_REGISTER.structureClose}
          ctaLabel={TALISU_REGISTER.ctaLabel}
          ctaNote={TALISU_REGISTER.ctaNote}
        />
        <div className="mt-6 text-[13px] text-neutral-600" data-testid="talisu-register-partner">
          <span className="font-semibold text-neutral-900">{TALISU_REGISTER.partnerName}</span>
          {" · "}
          {TALISU_REGISTER.partnerHeading}
        </div>
      </AdviserLayout>
    );
  }

  // Server side of the lock: the checkout needs at least one valid structure
  // (the URL first, else the choice remembered on this page for the PMC
  // sequence). Without one it goes back to the landing (?locked=structure).
  const cookieStore = await cookies();
  const structures = urlStructures.length
    ? urlStructures
    : parseRegisterStructures(cookieStore.get(REGISTER_STRUCTURE_COOKIE)?.value);
  if (!structures.length) {
    redirect(registerLockedHref(firstParam(params.fastCode)));
  }
  const structureTabs = TALISU_REGISTER.structures.filter((s) =>
    (structures as readonly string[]).includes(s.id),
  );

  // PMC gate (every registrant): Demo → claim Mapsite → Talispros → Media
  // Directory → Contract (agent code) → sign → here → payment. No claimed
  // Mapsite → demo/claim start; unsigned → the sequence. Paid users pass.
  await enforcePmcRegistrationGate(firstParam(params.fastCode));

  const checkoutUrl = registerStructureCheckoutUrl(TALISU_REGISTER.samcartUrl, structures);

  return (
    <SectionShell title={TALISU_REGISTER.title} maxWidthClass="max-w-[1920px]">
      {/* Partner write-up stays compact; SamCart gets the remaining width so its
          native two-column checkout (order + form) can sit side by side. */}
      <div className="mb-14 grid items-start gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className={TALISU_CARD}>
          <div className="mb-5 flex justify-center">
            <Image
              src={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
              alt="Aisha C."
              width={896}
              height={1200}
              className="h-auto w-full max-w-[220px] rounded-xl object-cover shadow-sm"
              sizes="220px"
              priority
            />
          </div>
          <h2 className="text-xl font-semibold text-[#0069CF]">
            {TALISU_REGISTER.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-neutral-950">
            {TALISU_REGISTER.partnerName}
          </p>
          {structureTabs.length ? (
            <div
              data-testid="register-structure"
              data-structure-id={structures.join(",")}
              className="mt-4 rounded-xl border border-[#046BD9]/25 bg-[#EAF3FF] px-3 py-2.5 text-sm text-neutral-800"
            >
              <span className="font-semibold text-neutral-950">
                {structureTabs.length > 1
                  ? TALISU_REGISTER.structuresSelected
                  : TALISU_REGISTER.structureSelected}
              </span>{" "}
              {structureTabs.map((s) => s.label).join(", ")}
              {" · "}
              <Link
                href={talisURegisterStructureHref(structures)}
                className="font-semibold text-[#046BD9] underline-offset-2 hover:underline"
              >
                {TALISU_REGISTER.structureChange}
              </Link>
            </div>
          ) : null}
          <p className="mt-3 text-sm text-neutral-700">
            {TALISU_REGISTER.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600">
            {TALISU_REGISTER.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-[#0069CF]">
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
