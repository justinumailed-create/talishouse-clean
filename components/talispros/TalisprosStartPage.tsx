import TalisprosHomeGate from "@/components/talispros/TalisprosHomeGate";
import TalisprosHomeShowcase from "@/components/talispros/TalisprosHomeShowcase";

/**
 * Homepage gate inspired by marketplace-select split layout:
 * left = Talispros logo + Login (FAST Codes™) + System Demo;
 * right = live demo flow (Talismaps™ → Talisbooks™ → claimed Mapsite™).
 */
export default function TalisprosStartPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 lg:h-dvh lg:min-h-0 lg:grid lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] lg:overflow-hidden">
      <div className="flex flex-none flex-col border-b border-neutral-200 lg:min-h-0 lg:border-b-0 lg:overflow-y-auto lg:overscroll-contain lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
        <TalisprosHomeGate />
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <TalisprosHomeShowcase />
      </div>
    </div>
  );
}
