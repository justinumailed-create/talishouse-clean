import type { Metadata } from "next";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import FsboIntakeForm from "@/components/fsbo/FsboIntakeForm";

export const metadata: Metadata = {
  title: "List a property | Tsplits™",
  description: "FSBO sellers list a property through Tsplits™. A Listings Manager posts it to Properstar with a voice pitch.",
  robots: { index: false, follow: false },
};

export default function FsboIntakePage() {
  return (
    <div className="min-h-dvh bg-[#f6f4ef] text-neutral-950">
      <TalisUMktsHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#046BD9]">Tsplits™ FSBO</p>
        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em]">
          List your property
        </h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-neutral-700">
          FSBO sellers list through Tsplits™. A Listings Manager reviews the listing and posts it to Properstar with a voice pitch.
        </p>
        <div className="mt-8">
          <FsboIntakeForm />
        </div>
      </main>
    </div>
  );
}
