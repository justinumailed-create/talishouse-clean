import { TALISU_REGISTER } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-amber-200">
            {TALISU_REGISTER.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-white">
            {TALISU_REGISTER.partnerName}
          </p>
          <p className="mt-3 text-sm text-white/70">
            {TALISU_REGISTER.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            {TALISU_REGISTER.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-white">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-amber-100">
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
