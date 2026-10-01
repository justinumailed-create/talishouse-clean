import Link from "next/link";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import { TALISU_BTN_PRIMARY, TALISU_CARD } from "@/lib/talisu/ui";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Video",
  description: "TalisU™ video library and TalisTV™ programming.",
  path: "/talisu/video",
});

/**
 * Video hub stub. Password gate can be added later — do not block ship.
 */
export default function TalisUVideoPage() {
  return (
    <SectionShell
      title="Video"
      subtitle="Walk-throughs, open houses, and partner programming. Password protection coming soon."
    >
      <div className={`${TALISU_CARD} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
        <p className="max-w-md text-sm text-neutral-600">
          Full TalisU™ video collection is on the way. Open TalisTV™ for the live
          schedule and channel experience.
        </p>
        <Link href="/talistv" className={TALISU_BTN_PRIMARY}>
          Open TalisTV™
        </Link>
      </div>
    </SectionShell>
  );
}
