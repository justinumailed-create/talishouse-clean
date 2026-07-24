"use client";

import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import type { RegistrationMarket } from "@/lib/registration-market";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

interface ClaimMarketRegistrationClientProps {
  market: RegistrationMarket;
  mapsiteId: string;
  returnTo: string;
}

export default function ClaimMarketRegistrationClient({
  market,
  mapsiteId,
}: ClaimMarketRegistrationClientProps) {
  return (
    <TalisprosMarketRegistrationForm
      market={market}
      mapsiteId={mapsiteId}
      variant="page"
      onSuccess={(result) => {
        const params = new URLSearchParams({
          claimed: "1",
          view: "pin",
          mapsiteId: result.mapsiteId || mapsiteId,
          audience: market,
        });
        if (result.fastCode) {
          params.set("fastCode", result.fastCode);
        }
        if (result.requestId) {
          params.set("requestId", result.requestId);
        }
        // Full navigation so brokers PMC browse state cannot win over soft nav.
        window.location.assign(`${MAPSITE_APP_PATH}?${params.toString()}`);
      }}
    />
  );
}
