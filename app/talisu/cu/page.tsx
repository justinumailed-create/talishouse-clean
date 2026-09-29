import { SEA_CAN_CONTACT, SEA_CAN_SKUS, SEA_CAN_TAGLINE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import SeaCanProductGrid from "@/components/talisu/SeaCanProductGrid";
import SeaCansLocalNav from "@/components/talisu/SeaCansLocalNav";
import TalisULeadForm from "@/components/talisu/TalisULeadForm";

export const metadata = createTalisUMetadata({
  title: "TalisU Sea-Cans | Contact Us",
  description: SEA_CAN_TAGLINE,
  path: "/talisu/cu",
});

export default function TalisUContactPage() {
  return (
    <SectionShell
      title={`TalisU Sea-Cans · ${SEA_CAN_CONTACT.title}`}
      subtitle={SEA_CAN_TAGLINE}
    >
      <SeaCansLocalNav />
      <div className="mb-10">
        <p className="mb-4 text-sm font-medium text-neutral-600">Product</p>
        <SeaCanProductGrid linkToCheckout={false} />
      </div>

      <div className="mx-auto max-w-lg">
        <TalisULeadForm
          source="talisu-contact"
          heading={SEA_CAN_CONTACT.heading}
          productOptions={SEA_CAN_SKUS.map((s) => ({
            value: s.code,
            label: s.name,
          }))}
          submitLabel="Send message"
        />
      </div>
    </SectionShell>
  );
}
