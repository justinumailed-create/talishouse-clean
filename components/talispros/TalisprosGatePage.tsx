import { Libre_Baskerville } from "next/font/google";
import TalisprosHomeGate from "@/components/talispros/TalisprosHomeGate";
import TalisprosHomeShowcase from "@/components/talispros/TalisprosHomeShowcase";
import TalisprosSamCartReturnBanner from "@/components/talispros/TalisprosSamCartReturnBanner";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import TalisprosHomeCornerLinks from "@/components/talispros/TalisprosHomeCornerLinks";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

/**
 * Homepage gate (`/`): TalisU blue navbar; Login + System Demo + FAST on the
 * left (40%); right (60%) is mountain image above + metallic ownership-model
 * buttons (popover details) below. SamCart payment success returns here and
 * keeps the same gate flow. Former homepage content lives at `/start`.
 *
 * Blue navbar sits outside Libre Baskerville so it matches Bookshelf/inner
 * Poppins typography (shared TalisUMktsHeader + font-sans).
 */
export default function TalisprosGatePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <TalisUMktsHeader />
      <TalisprosHomeCornerLinks />
      <div
        className={`${libreBaskerville.className} flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[40%_60%] lg:overflow-hidden`}
      >
        <div className="flex flex-none flex-col border-b border-neutral-200 lg:min-h-0 lg:border-b-0 lg:overflow-y-auto lg:overscroll-contain lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
          <TalisprosSamCartReturnBanner />
          <TalisprosHomeGate />
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
          <TalisprosHomeShowcase />
        </div>
      </div>
    </div>
  );
}
