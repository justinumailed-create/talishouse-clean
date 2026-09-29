import { SEA_CAN_BO, SEA_CAN_SKUS, SEA_CAN_TAGLINE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import SeaCanProductGrid from "@/components/talisu/SeaCanProductGrid";
import TalisULeadForm from "@/components/talisu/TalisULeadForm";

export const metadata = createTalisUMetadata({
  title: "TalisU Sea-Cans | Business Office",
  description: SEA_CAN_TAGLINE,
  path: "/talisu/bo",
});

export default function TalisUBusinessOfficePage() {
  return (
    <SectionShell title={`TalisU Sea-Cans · ${SEA_CAN_BO.title}`} subtitle={SEA_CAN_TAGLINE}>
      <p className="mb-4 text-sm font-medium text-white/70">
        {SEA_CAN_BO.productLabel}
      </p>
      <SeaCanProductGrid />

      <div className="mx-auto mt-12 max-w-lg">
        <TalisULeadForm
          source="talisu-bo-interest"
          heading={SEA_CAN_BO.interestHeading}
          subheading={SEA_CAN_BO.interestSubheading}
          productOptions={SEA_CAN_SKUS.map((s) => ({
            value: s.code,
            label: s.name,
          }))}
          submitLabel="Express interest"
        />
      </div>
    </SectionShell>
  );
}
