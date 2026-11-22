import type { Metadata } from "next";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import FsboSampleListing from "@/components/fsbo/FsboSampleListing";

export const metadata: Metadata = {
  title: "Sample listing | Tsplits™",
  description: "A sample FSBO home listed through Tsplits™, with a voice pitch preview.",
  robots: { index: false, follow: false },
};

export default function FsboSamplePage() {
  return (
    <div className="min-h-dvh bg-[#f6f4ef] text-neutral-950">
      <TalisUMktsHeader />
      <FsboSampleListing />
    </div>
  );
}
