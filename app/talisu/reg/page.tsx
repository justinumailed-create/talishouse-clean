import Image from "next/image";
import { TALISU_REGISTER } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Register Account",
  description:
    "Register your TalisU™ marketing partner account via SamCart checkout.",
  path: "/talisu/reg",
});

export default function TalisURegisterPage() {
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
    </SectionShell>
  );
}
