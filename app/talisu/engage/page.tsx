import { TALISU_ENGAGE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-amber-200">
            {TALISU_ENGAGE.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-white">
            {TALISU_ENGAGE.partnerName}
          </p>
          <p className="mt-3 text-sm text-white/70">
            {TALISU_ENGAGE.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            {TALISU_ENGAGE.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-white">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-amber-100">
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
