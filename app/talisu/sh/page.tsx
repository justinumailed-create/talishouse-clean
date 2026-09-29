import { SEA_CAN_SHOW_HOME } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_BTN_PRIMARY } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import SeaCanProductGrid from "@/components/talisu/SeaCanProductGrid";
import SeaCansLocalNav from "@/components/talisu/SeaCansLocalNav";
import TalisUShowHomeMap from "@/components/talisu/TalisUShowHomeMap";

export const metadata = createTalisUMetadata({
  title: "TalisU Sea-Cans | Show Home",
  description: SEA_CAN_SHOW_HOME.heading,
  path: "/talisu/sh",
});

export default function TalisUShowHomePage() {
  return (
    <SectionShell
      title={`TalisU Sea-Cans · ${SEA_CAN_SHOW_HOME.title}`}
      subtitle={SEA_CAN_SHOW_HOME.heading}
    >
      <SeaCansLocalNav />
      <div className="mb-8 text-center">
        <a href={SEA_CAN_SHOW_HOME.phoneHref} className={TALISU_BTN_PRIMARY}>
          Call {SEA_CAN_SHOW_HOME.contactName}: {SEA_CAN_SHOW_HOME.phoneDisplay}
        </a>
      </div>

      <TalisUShowHomeMap />

      <div className="mt-10">
        <p className="mb-4 text-sm font-medium text-neutral-600">Product</p>
        <SeaCanProductGrid />
      </div>
    </SectionShell>
  );
}
