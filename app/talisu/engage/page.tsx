import { TALISU_ENGAGE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Engage the Team",
  description:
    "Send a down payment to engage Webster and the design team for Glasshouse, Talishouse, Talistown, or Talisdome projects.",
  path: "/talisu/engage",
});

export default function TalisUEngagePage() {
  return (
    <SectionShell
      title={TALISU_ENGAGE.title}
      subtitle={TALISU_ENGAGE.headline}
    >
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <div className={TALISU_CARD}>
          <h2 className="text-xl font-semibold text-[#0069CF]">
            {TALISU_ENGAGE.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-neutral-950">
            {TALISU_ENGAGE.partnerName}
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            {TALISU_ENGAGE.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600">
            {TALISU_ENGAGE.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-[#0069CF]">
            {TALISU_ENGAGE.closing}
          </p>
        </div>

        <SamCartEmbed
          src={TALISU_ENGAGE.samcartUrl}
          title="TalisU Engage — SamCart"
          height={1500}
        />
      </div>
    </SectionShell>
  );
}
