import { SEA_CAN_BO, SEA_CAN_SKUS, SEA_CAN_TAGLINE } from "@/lib/talisu/content";
import SectionShell from "@/components/talisu/SectionShell";
import SeaCanProductGrid from "@/components/talisu/SeaCanProductGrid";
import SeaCansLocalNav from "@/components/talisu/SeaCansLocalNav";
import TalisULeadForm from "@/components/talisu/TalisULeadForm";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/bo");
}

export default function TalisUBusinessOfficePage() {
  return (
    <SectionShell
      title={`TalisU Sea-Cans · ${SEA_CAN_BO.title}`}
      subtitle={SEA_CAN_TAGLINE}
    >
      <SeaCansLocalNav />
      <p className="mb-4 text-sm font-medium text-neutral-600">
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
