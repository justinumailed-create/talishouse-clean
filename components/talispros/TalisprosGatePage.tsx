import TalisprosHomeGate from "@/components/talispros/TalisprosHomeGate";
import { libreBaskerville } from "@/lib/fonts";
import TalisprosHomeShowcase from "@/components/talispros/TalisprosHomeShowcase";
import TalisprosSamCartReturnBanner from "@/components/talispros/TalisprosSamCartReturnBanner";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import TalisprosHomeCornerLinks from "@/components/talispros/TalisprosHomeCornerLinks";
import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import HomePitchLock from "@/components/talispros/HomePitchLock";
import { cookies } from "next/headers";
import { MAPSITE_OWNER_COOKIE, MAPSITE_ROOT_ACCOUNT_COOKIE } from "@/lib/mapsite-account-session";

/**
 * Homepage gate (`/`): TalisU blue navbar; Login + Build Demo + FAST on the
 * left (40%); right (60%) is mountain image above + metallic ownership-model
 * buttons (popover details) below. SamCart payment success returns here and
 * keeps the same gate flow. Former homepage content lives at `/start`.
 *
 * Blue navbar sits outside Libre Baskerville so it matches Bookshelf/inner
 * Poppins typography (shared TalisUMktsHeader + font-sans).
 */
export default async function TalisprosGatePage() {
  const jar = await cookies();
  const pitchExempt = Boolean(
    jar.get(MAPSITE_OWNER_COOKIE)?.value?.trim() || jar.get(MAPSITE_ROOT_ACCOUNT_COOKIE)?.value?.trim(),
  );
  return (
    <HomePitchLock exempt={pitchExempt}>
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <TalisUMktsHeader />
      <div
        className={`${libreBaskerville.className} flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[40%_60%] lg:overflow-hidden`}
      >
        <div className="flex flex-none flex-col border-b border-neutral-200 lg:min-h-0 lg:border-b-0 lg:overflow-y-auto lg:overscroll-contain lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
          <TalisprosSamCartReturnBanner />
          <TalisprosHomeGate pitchExempt={pitchExempt} />
          <TalisprosHomeCornerLinks />
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
          <TalisprosHomeShowcase />
        </div>
      </div>
      <AishaConvaiWidget startHref="/aisha?call=1" />
    </div>
    </HomePitchLock>
  );
}
