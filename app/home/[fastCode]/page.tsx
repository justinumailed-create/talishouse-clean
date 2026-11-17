import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PersonalHomeBody from "@/components/talispros/personal-home/PersonalHomeBody";
import PersonalHomeEditor from "@/components/talispros/personal-home/PersonalHomeEditor";
import PersonalHomeMapsite from "@/components/talispros/personal-home/PersonalHomeMapsite";
import LegalLinks from "@/components/legal/LegalLinks";
import PersonalHomeNav from "@/components/talispros/personal-home/PersonalHomeNav";
import PersonalHomeSide from "@/components/talispros/personal-home/PersonalHomeSide";
import MapsiteAisha from "@/components/talispros/MapsiteAisha";
import { mapsiteShowsAisha } from "@/lib/talispros/aisha-mapsites";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { ROUTES } from "@/lib/routes";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
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
  return dynamicPageMetadata((lang) => {
    const m = getDictionary(lang).meta.personalHome;
    const name =
      lookup.kind === "ok"
        ? lookup.data.resolved.headline || lookup.data.displayName
        : getDictionary(lang).personalHome.fallbackName;
    return {
      title: clampSeoText(fillPersonalHomeCopy(m.title, { name }), 70),
      description: clampSeoText(fillPersonalHomeCopy(m.description, { name }), 160),
      path,
      image: `/api/og/personal-home/${encodeURIComponent(
        lookup.kind === "ok" ? lookup.data.code : fastCode,
      )}`,
      alt: fillPersonalHomeCopy(m.ogImageAlt, { name }),
      noindex: lookup.kind !== "ok" || lookup.data.isDemo,
    };
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
  const [lookup, facts, agentAccess] = await Promise.all([
    loadPersonalHomePage(fastCode, locale),
    readSystemFastCodeFacts(fastCode),
    hasProspectAccess().catch(() => false),
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
  const copy = getDictionary(locale).personalHome.edit;
  const homePins = [
    {
      id: data.view.id,
      label: data.view.propertyTitle?.trim() || data.view.propertyAddress?.trim() || copy.homePin,
    },
    ...extraPins.map((pin) => ({ id: pin.id, label: pin.label.trim() || "PIN" })),
  ];
  const buttons = normalizePersonalHomeButtons(resolved.buttons, {
    mapsiteHref: data.mapsiteHref,
    bookshelfHref: `/talisbooks/fast/${encodeURIComponent(data.code)}`,
    tebHref: data.view.tebUrl?.trim() || null,
    pinIds: homePins.map((pin) => pin.id),
  }).filter((button) => {
    if (!canEdit && !isVisitorPersonalHomeOpen(button.kind)) return false;
    if (publicSystem && button.kind === "link" && isOwnerOnlyPersonalHomeHref(button.href)) return false;
    return true;
  });
  const paragraphs = resolved.writeUp.split(/\n{2,}/).filter((part) => part.trim());

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#f5f1ea]"
      data-testid="personal-home-page"
      data-gate={facts.trace}
      data-agent={agentAccess ? "1" : "0"}
    >
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
      <main className="flex-1">
        <PersonalHomeBody
          kicker={resolved.kicker}
          headline={resolved.headline}
          contactName={resolved.contactName}
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
          <div
            className="mt-4 max-w-[60ch] space-y-3 text-[15px] leading-relaxed text-neutral-800 sm:mt-5 sm:text-[17px]"
            data-testid="personal-home-write-up"
          >
            {paragraphs.map((paragraph, index) => (
              <div key={index} className="whitespace-pre-line">
                {paragraph}
              </div>
            ))}
          </div>
          {buttons.length ? (
            <div
              className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
              data-testid="personal-home-buttons"
            >
              {buttons.map((button, index) => {
                const className = index === 0 ? CTA_PRIMARY : CTA_SECONDARY;
                return isExternalPersonalHomeHref(button.href) ? (
                  <a
                    key={`${index}-${button.href}`}
                    href={button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {button.label}
                  </a>
                ) : button.href.startsWith("/") ? (
                  <Link
                    key={`${index}-${button.href}`}
                    href={button.href}
                    prefetch={false}
                    className={className}
                  >
                    {button.label}
                  </Link>
                ) : (
                  <a key={`${index}-${button.href}`} href={button.href} className={className}>
                    {button.label}
                  </a>
                );
              })}
            </div>
          ) : null}
        </PersonalHomeBody>
      </main>
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
      {mapsiteShowsAisha(data.view.status) ? (
        <MapsiteAisha
          ownerFirstName={data.view.ownerFirstName}
          agentName={data.view.agentName}
          fastCode={data.view.fastCode}
          mapsiteTitle={data.view.propertyTitle}
        />
      ) : null}
    </div>
  );
}
