import { SEA_CAN_SHOW_HOME, SEA_CAN_TAGLINE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import SeaCanProductGrid from "@/components/talisu/SeaCanProductGrid";
import TalisUShowHomeMap from "@/components/talisu/TalisUShowHomeMap";

export const metadata = createTalisUMetadata({
  title: "TalisU Sea-Cans | Show Home",
  description: SEA_CAN_TAGLINE,
  path: "/talisu/sh",
});

export default function TalisUShowHomePage() {
  return (
    <SectionShell
      title={`TalisU Sea-Cans · ${SEA_CAN_SHOW_HOME.title}`}
      subtitle={SEA_CAN_SHOW_HOME.heading}
    >
      <div className="mb-8 text-center">
        <a
          href={SEA_CAN_SHOW_HOME.phoneHref}
          className="inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-500/20"
        >
          Call {SEA_CAN_SHOW_HOME.contactName}: {SEA_CAN_SHOW_HOME.phoneDisplay}
        </a>
      </div>

      <TalisUShowHomeMap />

      <div className="mt-10">
        <p className="mb-4 text-sm font-medium text-white/70">Product</p>
        <SeaCanProductGrid />
      </div>
    </SectionShell>
  );
}
