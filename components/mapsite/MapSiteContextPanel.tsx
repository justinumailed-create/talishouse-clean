"use client";

import { useCallback, useEffect, useState } from "react";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import ExpressInterestPanel from "./ExpressInterestPanel";
import RootAccountRegistrationPanel from "./RootAccountRegistrationPanel";

interface MapSiteContextPanelProps {
  fastCode: string;
  agentName: string;
  agentEmail: string;
  offeredSubscriptionTier: OfferedSubscriptionTier;
  interestFormEnabled: boolean;
  initialHasSubscribed: boolean;
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
      <h2 className="text-sm sm:text-base font-semibold text-neutral-800 text-center">
        {title}
      </h2>
    </div>
  );
}

export default function MapSiteContextPanel({
  fastCode,
  agentName,
  agentEmail,
  offeredSubscriptionTier,
  interestFormEnabled,
  initialHasSubscribed,
}: MapSiteContextPanelProps) {
  const [hasSubscribed, setHasSubscribed] = useState(initialHasSubscribed);
  const [checking, setChecking] = useState(false);

  const refreshAccountStatus = useCallback(async () => {
    setChecking(true);
    try {
      const status = await getMapSiteVisitorAccountStatus();
      setHasSubscribed(status.hasSubscribed);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccountStatus();
  }, [refreshAccountStatus]);

  useEffect(() => {
    function handleRegistered() {
      void refreshAccountStatus();
    }

    window.addEventListener("mapsite:root-account-registered", handleRegistered);
    window.addEventListener("focus", handleRegistered);

    return () => {
      window.removeEventListener(
        "mapsite:root-account-registered",
        handleRegistered
      );
      window.removeEventListener("focus", handleRegistered);
    };
  }, [refreshAccountStatus]);

  const showInterestForm = hasSubscribed && interestFormEnabled;
  const title = showInterestForm
    ? "Express an Interest"
    : "Register Your MapSite™";

  return (
    <div className="flex flex-col min-h-0 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white lg:h-full">
      <PanelHeader title={title} />
      <div className="flex-1 min-h-0 flex flex-col">
        {checking && hasSubscribed === initialHasSubscribed ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
            Loading...
          </div>
        ) : showInterestForm ? (
          <ExpressInterestPanel
            fastCode={fastCode}
            agentName={agentName}
            agentEmail={agentEmail}
            embedded
            fillHeight
          />
        ) : hasSubscribed && !interestFormEnabled ? (
          <div className="p-6 text-sm text-neutral-600 text-center">
            Your subscription is active. The interest form is not enabled for
            this MapSite.
          </div>
        ) : (
          <RootAccountRegistrationPanel allowedTier={offeredSubscriptionTier} />
        )}
      </div>
    </div>
  );
}
