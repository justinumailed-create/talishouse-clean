import TalisprosHomeGate from "@/components/talispros/TalisprosHomeGate";
import TalisprosSamCartReturnBanner from "@/components/talispros/TalisprosSamCartReturnBanner";

/**
 * /start gate: a clean, centered Login + System Demo entry point.
 * SamCart payment success returns here and keeps the same gate flow.
 */
export default function TalisprosGatePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900">
      <TalisprosSamCartReturnBanner />
      <main className="flex min-h-0 flex-1 flex-col">
        <TalisprosHomeGate />
      </main>
    </div>
  );
}
