import Image from "next/image";
import Link from "next/link";
import { TALISU_REGISTER } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_BTN_PRIMARY, TALISU_CARD } from "@/lib/talisu/ui";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Register Account",
  description:
    "Register your TalisU™ marketing partner account, browse the T-All catalogue, and purchase via SamCart checkout.",
  path: "/talisu/reg",
});

export default function TalisURegisterPage() {
  const catalogueCover = loadProductFlipbookPages()[0] ?? null;
  const catalogue = TALISU_REGISTER.catalogue;

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
            src={TALISU_REGISTER.samcartUrl}
            title="TalisU Register — SamCart"
            height={1500}
          />
        </div>
      </div>

      <section
        id="catalogue"
        aria-labelledby="register-catalogue-heading"
        className="scroll-mt-28"
      >
        <h2
          id="register-catalogue-heading"
          className="text-center text-xl font-semibold text-neutral-950 sm:text-2xl"
        >
          {catalogue.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-neutral-600 sm:text-base">
          {catalogue.body}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <div className={`${TALISU_CARD} lg:col-span-2`}>
            {catalogueCover?.src ? (
              <img
                src={catalogueCover.src}
                alt={catalogueCover.alt}
                className="h-auto w-full rounded-xl object-contain ring-1 ring-black/5"
              />
            ) : null}
            <p className="mt-4 text-sm text-neutral-700">
              {catalogue.previewCaption}
            </p>
            <Link href={catalogue.href} className={`${TALISU_BTN_PRIMARY} mt-4`}>
              {catalogue.openLabel}
            </Link>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <h3 className="text-xl font-semibold text-[#0069CF]">
              Purchase
            </h3>
            <p className="mt-3 text-sm text-neutral-700">
              Complete your purchase in the SamCart checkout below.
            </p>
            <div className="mt-5">
              <SamCartEmbed
                src={TALISU_REGISTER.purchaseUrl}
                title="TalisU Purchase — SamCart"
                height={1100}
              />
            </div>
          </div>
        </div>
      </section>
    </SectionShell>
  );
}
