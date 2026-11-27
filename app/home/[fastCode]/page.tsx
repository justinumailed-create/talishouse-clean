import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PersonalHomeBody from "@/components/talispros/personal-home/PersonalHomeBody";
import PersonalHomeWriteUp from "@/components/talispros/personal-home/PersonalHomeWriteUp";
import PersonalHomeEditor from "@/components/talispros/personal-home/PersonalHomeEditor";
import PersonalHomeMapsite from "@/components/talispros/personal-home/PersonalHomeMapsite";
import LegalLinks from "@/components/legal/LegalLinks";
import PersonalHomeNav from "@/components/talispros/personal-home/PersonalHomeNav";
import PersonalHomeSide from "@/components/talispros/personal-home/PersonalHomeSide";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { ROUTES } from "@/lib/routes";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { applyBrandedFastCodeShareMetadata } from "@/lib/talispros/branded-fast-code-media";
import { listMapSiteAdditionalPins } from "@/lib/talispros/mapsite-additional-pins-service";
import {
  clampSeoText,
  fillPersonalHomeCopy,
  isExternalPersonalHomeHref,
  isVisitorPersonalHomeOpen,
  normalizePersonalHomeButtons,
  personalHomeEditPath,
} from "@/lib/talispros/personal-home";
import { loadPersonalHomeMap } from "@/lib/talispros/personal-home-map";
import {
  canEditPersonalHome,
  loadPersonalHomePage,
  personalHomeClaimMarketHref,
} from "@/lib/talispros/personal-home-page";
import { hasProspectAccess } from "@/lib/talispros/prospect-gate-server";
import {
  isOwnerOnlyPersonalHomeHref,
  restrictSystemFastCodeFeatures,
} from "@/lib/talispros/system-fast-code-gate";
import { readSystemFastCodeFacts } from "@/lib/talispros/system-fast-code-access";
import { isFastCodeDisqualified } from "@/lib/talispros/market-disqualify-server";
import { isRegistrationOfferHref } from "@/lib/talispros/webster-project";
import { HOME_MARKET_PATH } from "@/lib/talisu/home-market-path";
import {
  applyGetOwnMapsiteButton,
  isGetOwnMapsiteButton,
} from "@/lib/talispros/get-own-mapsite";
import { getGetOwnMapsiteButtonEnabled } from "@/lib/talispros/get-own-mapsite-settings";

export const dynamic = "force-dynamic";

type PersonalHomePageProps = {
  params: Promise<{ fastCode: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const CTA =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-2 text-center text-[15px] font-semibold no-underline transition sm:text-[16px]";
const CTA_PRIMARY = `${CTA} bg-[#046BD9] text-white! shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3]`;
const CTA_SECONDARY = `${CTA} border border-neutral-900/15 bg-white text-neutral-950! hover:bg-neutral-50`;

export async function generateMetadata({ params }: PersonalHomePageProps) {
  const { fastCode } = await params;
  const locale = await getLocale();
  const lookup = await loadPersonalHomePage(fastCode, locale);
  const path = lookup.kind === "ok" ? lookup.data.homeHref : `/home/${fastCode}`;
  const name =
    lookup.kind === "ok"
      ? lookup.data.resolved.headline || lookup.data.displayName
      : getDictionary(locale).personalHome.fallbackName;
  const code = lookup.kind === "ok" ? lookup.data.code : fastCode;
  const alt = fillPersonalHomeCopy(
    getDictionary(locale).meta.personalHome.ogImageAlt,
    { name },
  );
  const metadata = await dynamicPageMetadata((lang) => {
    const m = getDictionary(lang).meta.personalHome;
    const pageName =
      lookup.kind === "ok"
        ? lookup.data.resolved.headline || lookup.data.displayName
        : getDictionary(lang).personalHome.fallbackName;
    return {
      title: clampSeoText(fillPersonalHomeCopy(m.title, { name: pageName }), 70),
      description: clampSeoText(
        fillPersonalHomeCopy(m.description, { name: pageName }),
        160,
      ),
      path,
      image: `/api/og/personal-home/${encodeURIComponent(code)}`,
      alt: fillPersonalHomeCopy(m.ogImageAlt, { name: pageName }),
      noindex: lookup.kind !== "ok" || lookup.data.isDemo,
    };
  });
  return applyBrandedFastCodeShareMetadata(metadata, {
    fastCode: code,
    homeImageUrl: lookup.kind === "ok" ? lookup.data.resolved.imageUrl : null,
    alt,
  });
}

/**
 * Personal home page of a root account holder (owner of a FAST Code™ /
 * Mapsite), shown before their Mapsite. Adviser layout (as on /talisu/reg and
 * /talisu/engage) with the owner's photo, write-up and buttons; content falls
 * back to the Mapsite record until the owner customises it.
 */
export default async function PersonalHomePage({
  params,
  searchParams,
}: PersonalHomePageProps) {
  const { fastCode } = await params;
  const query = (await searchParams) ?? {};
  const locale = await getLocale();
  const [lookup, facts, agentAccess, showGetOwnMapsite] = await Promise.all([
    loadPersonalHomePage(fastCode, locale),
    readSystemFastCodeFacts(fastCode),
    hasProspectAccess().catch(() => false),
    getGetOwnMapsiteButtonEnabled(),
  ]);
  const publicSystem = restrictSystemFastCodeFeatures({
    systemGenerated: facts.systemGenerated,
    registeredOrClaimed: facts.registeredOrClaimed,
    agentAccess,
  });
  if (lookup.kind === "allpins") redirect(ROUTES.TALISU_MARKETS);
  if (lookup.kind === "missing") notFound();

  const { data } = lookup;
  const { resolved } = data;
  // A system code has no owner session. The entry action clears a matching
  // cookie before redirect; this render only ignores it (canEdit stays false).
  const canEdit = !publicSystem && (await canEditPersonalHome(data.code));
  if (!canEdit && (await isFastCodeDisqualified(data.code))) notFound();
  const homeMap = publicSystem ? await loadPersonalHomeMap(data.code) : null;
  const mapsiteHref = publicSystem ? `${data.homeHref}#mapsite` : data.mapsiteHref;
  const extraPins = await listMapSiteAdditionalPins(data.view.id).catch(() => []);
  const homeCopy = getDictionary(locale).personalHome;
  const copy = homeCopy.edit;
  const homePins = [
    {
      id: data.view.id,
      label: data.view.propertyTitle?.trim() || data.view.propertyAddress?.trim() || copy.homePin,
    },
    ...extraPins.map((pin) => ({ id: pin.id, label: pin.label.trim() || "PIN" })),
  ];
  const buttons = applyGetOwnMapsiteButton(
    normalizePersonalHomeButtons(resolved.buttons, {
      mapsiteHref: data.mapsiteHref,
      bookshelfHref: `/talisbooks/fast/${encodeURIComponent(data.code)}`,
      tebHref: data.view.tebUrl?.trim() || null,
      pinIds: homePins.map((pin) => pin.id),
    }),
    {
      enabled: showGetOwnMapsite,
      label: homeCopy.getOwnMapsite,
      href: HOME_MARKET_PATH,
    },
  );
  const offerProject = !data.isDemo && (canEdit || facts.registeredOrClaimed);
  const visibleButtons = buttons.filter((button) => {
    if (!canEdit && !isVisitorPersonalHomeOpen(button.kind)) return false;
    if (publicSystem && button.kind === "link" && isOwnerOnlyPersonalHomeHref(button.href)) return false;
    if (offerProject && isRegistrationOfferHref(button.href)) return false;
    return true;
  });

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#f5f1ea]"
      data-testid="personal-home-page"
      data-gate={facts.trace}
      data-agent={agentAccess ? "1" : "0"}
    >
      <div className="flex min-h-dvh flex-col">
        <PersonalHomeNav
          homeHref={data.homeHref}
          mapsiteHref={mapsiteHref}
          active="home"
          owner={
            canEdit
              ? {
                  name: resolved.headline || data.displayName,
                  imageUrl: resolved.imageUrl,
                  editHref: personalHomeEditPath(data.code),
                }
              : null
          }
        />
        <main className="flex flex-1 flex-col [&>.talis-adviser]:flex-1">
        <PersonalHomeBody
          fastCode={data.code}
          kicker={resolved.kicker}
          headline={resolved.headline}
          contactName={resolved.contactName}
          hasPhone={Boolean(resolved.contactPhone)}
          hasEmail={Boolean(resolved.contactEmail)}
          ownerName={data.displayName}
          imageSrc={
            resolved.sideMedia?.kind === "image" ? resolved.sideMedia.url : resolved.imageUrl
          }
          mediaFit={homeMap ? "map" : "cover"}
          imageAlt={fillPersonalHomeCopy(getDictionary(locale).personalHome.photoAlt, {
            name: resolved.headline || data.displayName,
          })}
          media={
            homeMap ? (
              <div id="mapsite" className="absolute inset-0">
                <PersonalHomeMapsite
                  mapsite={homeMap.mapsite}
                  flagIdentity={homeMap.flagIdentity}
                  flagName={homeMap.flagName}
                  hasTalisBook={homeMap.hasTalisBook}
                  claimHref={personalHomeClaimMarketHref(data.view.claimAudience)}
                />
              </div>
            ) : resolved.sideMedia && resolved.sideMedia.kind !== "image" ? (
              <PersonalHomeSide media={resolved.sideMedia} />
            ) : null
          }
        >
          <PersonalHomeWriteUp
            text={resolved.writeUp}
            className="mt-4 max-w-[60ch] space-y-3 text-[15px] leading-relaxed text-neutral-800 sm:mt-5 sm:text-[17px]"
          />
          {visibleButtons.length ? (
            <div
              className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
              data-testid="personal-home-buttons"
            >
              {visibleButtons.map((button, index) => {
                const isGetOwn = isGetOwnMapsiteButton(button, [homeCopy.getOwnMapsite]);
                const className = isGetOwn || index !== 0 ? CTA_SECONDARY : CTA_PRIMARY;
                const testId = isGetOwn ? "personal-home-get-own-mapsite" : undefined;
                return isExternalPersonalHomeHref(button.href) ? (
                  <a
                    key={`${index}-${button.href}`}
                    href={button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    data-testid={testId}
                  >
                    {button.label}
                  </a>
                ) : button.href.startsWith("/") ? (
                  <Link
                    key={`${index}-${button.href}`}
                    href={button.href}
                    prefetch={false}
                    className={className}
                    data-testid={testId}
                  >
                    {button.label}
                  </Link>
                ) : (
                  <a
                    key={`${index}-${button.href}`}
                    href={button.href}
                    className={className}
                    data-testid={testId}
                  >
                    {button.label}
                  </a>
                );
              })}
            </div>
          ) : null}
        </PersonalHomeBody>
        </main>
      </div>
      <footer className="border-t border-black/10 bg-white px-4 py-4">
        <div className="flex justify-center">
          <LegalLinks />
        </div>
      </footer>
      {canEdit ? (
        <PersonalHomeEditor
          fastCode={data.code}
          saved={data.saved}
          defaults={data.defaults}
          initialOpen={query.edit === "1"}
          homeOpens={{
            tebHref: data.view.tebUrl?.trim() || null,
            pins: homePins,
          }}
        />
      ) : null}
    </div>
  );
}
