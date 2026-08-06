"use client";

import { useCallback, useEffect, useState } from "react";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import ExpressInterestPanel from "./ExpressInterestPanel";
import MapSitePanelHeader from "./MapSitePanelHeader";
import RootAccountRegistrationPanel from "./RootAccountRegistrationPanel";

interface MapSiteContextPanelProps {
  fastCode: string;
  agentName: string;
  agentEmail: string;
  offeredSubscriptionTier: OfferedSubscriptionTier;
  interestFormEnabled: boolean;
  initialHasSubscribed: boolean;
  initialVisitorFastCode?: string | null;
  buildRequestId?: string;
}

export default function MapSiteContextPanel({
  fastCode,
  agentName,
  agentEmail,
  offeredSubscriptionTier,
  interestFormEnabled,
  initialHasSubscribed,
  initialVisitorFastCode = null,
  buildRequestId,
}: MapSiteContextPanelProps) {
  const [hasSubscribed, setHasSubscribed] = useState(initialHasSubscribed);
  const [visitorFastCode, setVisitorFastCode] = useState<string | null>(
    initialVisitorFastCode
  );
  const [checking, setChecking] = useState(false);

  const refreshAccountStatus = useCallback(async () => {
    setChecking(true);
    try {
      const status = await getMapSiteVisitorAccountStatus();
      setHasSubscribed(status.hasSubscribed);
      setVisitorFastCode(status.fastCode);
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

  const ownsThisMapSite =
    hasSubscribed &&
    visitorFastCode !== null &&
    visitorFastCode.trim().toLowerCase() === fastCode.trim().toLowerCase();

  const showInterestForm = ownsThisMapSite && interestFormEnabled;
  const title = showInterestForm
    ? "Express an Interest"
    : "Register Your Mapsite™";

  return (
    <div className="flex flex-col min-h-0 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white h-full">
      <MapSitePanelHeader
        title={title}
        className="bg-neutral-400 border-neutral-300"
        titleClassName="text-white"
        useLatoBold
      />
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
        ) : ownsThisMapSite && !interestFormEnabled ? (
          <div className="p-6 text-sm text-neutral-600 text-center">
            Your subscription is active. The interest form is not enabled for
            this Mapsite™.
          </div>
        ) : (
          <RootAccountRegistrationPanel
            allowedTier={offeredSubscriptionTier}
            buildRequestId={buildRequestId}
          />
        )}
      </div>
    </div>
  );
}
