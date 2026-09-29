import { TALISU_REGISTER } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Register Account",
  description:
    "Register your TalisU™ marketing partner account and market via SamCart checkout.",
  path: "/talisu/reg",
});

export default function TalisURegisterPage() {
  return (
    <SectionShell title={TALISU_REGISTER.title}>
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <div className={TALISU_CARD}>
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

        <SamCartEmbed
          src={TALISU_REGISTER.samcartUrl}
          title="TalisU Register — SamCart"
          height={1500}
        />
      </div>
    </SectionShell>
  );
}
