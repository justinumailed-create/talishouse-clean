import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import PersonalHomeEditor from "@/components/talispros/personal-home/PersonalHomeEditor";
import PersonalHomeNav from "@/components/talispros/personal-home/PersonalHomeNav";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { ROUTES } from "@/lib/routes";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import {
  clampSeoText,
  fillPersonalHomeCopy,
  isExternalPersonalHomeHref,
} from "@/lib/talispros/personal-home";
import {
  canEditPersonalHome,
  loadPersonalHomePage,
} from "@/lib/talispros/personal-home-page";

export const dynamic = "force-dynamic";

type PersonalHomePageProps = {
  params: Promise<{ fastCode: string }>;
};

const CTA =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-2 text-center text-[15px] font-semibold no-underline transition sm:text-[16px]";
const CTA_PRIMARY = `${CTA} bg-[#046BD9] text-white! shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3]`;
const CTA_SECONDARY = `${CTA} border border-neutral-900/15 bg-white text-neutral-950! hover:bg-neutral-50`;

export async function generateMetadata({ params }: PersonalHomePageProps) {
  const { fastCode } = await params;
  const locale = await getLocale();
  const lookup = await loadPersonalHomePage(fastCode, locale);
  const path = lookup.kind === "ok" ? lookup.data.homeHref : `/talispros/home/${fastCode}`;
  return dynamicPageMetadata((lang) => {
    const m = getDictionary(lang).meta.personalHome;
    const name =
      lookup.kind === "ok"
        ? lookup.data.resolved.headline
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
export default async function PersonalHomePage({ params }: PersonalHomePageProps) {
  const { fastCode } = await params;
  const locale = await getLocale();
  const lookup = await loadPersonalHomePage(fastCode, locale);
  if (lookup.kind === "allpins") redirect(ROUTES.TALISU_MARKETS);
  if (lookup.kind === "missing") notFound();

  const { data } = lookup;
  const { resolved } = data;
  const canEdit = await canEditPersonalHome(data.code);
  const paragraphs = resolved.writeUp.split(/\n{2,}/).filter((part) => part.trim());

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f1ea]" data-testid="personal-home-page">
      <PersonalHomeNav homeHref={data.homeHref} mapsiteHref={data.mapsiteHref} active="home" />
      <main className="flex-1">
        <AdviserLayout
          testId="personal-home"
          imageSrc={resolved.imageUrl}
          imageAlt={fillPersonalHomeCopy(getDictionary(locale).personalHome.photoAlt, {
            name: resolved.headline,
          })}
          imagePosition="center 22%"
          kicker={resolved.kicker}
          title={resolved.headline}
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
          {resolved.buttons.length ? (
            <div
              className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
              data-testid="personal-home-buttons"
            >
              {resolved.buttons.map((button, index) => {
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
        </AdviserLayout>
      </main>
      {canEdit ? (
        <PersonalHomeEditor fastCode={data.code} saved={data.saved} defaults={data.defaults} />
      ) : null}
    </div>
  );
}
