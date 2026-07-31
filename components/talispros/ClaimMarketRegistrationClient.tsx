"use client";

import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import type { RegistrationMarket } from "@/lib/registration-market";
import { buildSelfEbookContinueHref } from "@/lib/talispros/ebook-choice";
import { establishOwnerMapSiteSession } from "@/app/talispros/build-mapsite/success-actions";

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
        void (async () => {
          const fastCode = result.fastCode?.trim();
          if (fastCode) {
            await establishOwnerMapSiteSession(fastCode);
          }

          // First success: Self-Service TalisBook™ Creator (not Registration / PayPal).
          window.location.assign(
            buildSelfEbookContinueHref({
              fastCode: fastCode || null,
              mapsiteId: result.mapsiteId || mapsiteId,
              accountType: result.accountType || market,
              requestId: result.requestId || null,
            })
          );
        })();
      }}
    />
  );
}
