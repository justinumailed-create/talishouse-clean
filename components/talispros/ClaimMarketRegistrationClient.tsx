"use client";

import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import type { RegistrationMarket } from "@/lib/registration-market";
import { buildClaimedMapSitePath, MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

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
        const fastCode = result.fastCode?.trim();
        // Full navigation so brokers PMC browse state cannot win over soft nav.
        if (fastCode) {
          window.location.assign(
            buildClaimedMapSitePath({
              fastCode,
              accountType: result.accountType,
              audience: market,
            })
          );
          return;
        }

        const params = new URLSearchParams({
          claimed: "1",
          view: "pin",
          mapsiteId: result.mapsiteId || mapsiteId,
          audience: market,
        });
        if (result.requestId) params.set("requestId", result.requestId);
        window.location.assign(`${MAPSITE_APP_PATH}?${params.toString()}`);
      }}
    />
  );
}
