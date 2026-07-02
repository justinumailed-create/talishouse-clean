import RootAccountRegistrationForm from "@/components/talispros/RootAccountRegistrationForm";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import { OFFERED_SUBSCRIPTION_TIER_LABELS } from "@/lib/mapsite-subscription";

interface RootAccountRegistrationPanelProps {
  allowedTier: OfferedSubscriptionTier;
}

export default function RootAccountRegistrationPanel({
  allowedTier,
}: RootAccountRegistrationPanelProps) {
  return (
    <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300">
      <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
        Subscribe with{" "}
        <span className="font-medium text-neutral-800">
          {OFFERED_SUBSCRIPTION_TIER_LABELS[allowedTier]}
        </span>{" "}
        to activate your own MapSite™. You can also continue under a sponsor as
        a Derivative Account™, or select AdPro™ packages as individual PIN or
        multi-PIN options. After checkout you will be redirected to your new
        property page.
      </p>
      <RootAccountRegistrationForm variant="panel" allowedTier={allowedTier} />
    </div>
  );
}
