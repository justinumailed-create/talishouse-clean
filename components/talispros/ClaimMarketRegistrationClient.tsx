"use client";

import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import type { RegistrationMarket } from "@/lib/registration-market";
import { buildSelfEbookContinueHref } from "@/lib/talispros/ebook-choice";
import { openMapSiteAfterBuildRequest } from "@/app/talispros/build-mapsite/success-actions";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

interface ClaimMarketRegistrationClientProps {
  market: RegistrationMarket;
  mapsiteId?: string;
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
          const requestId = result.requestId?.trim() || null;
          const fastCode = result.fastCode?.trim() || null;

          if (!requestId) {
            window.alert(
              "Your submission did not return a Build Request ID. Please try again."
            );
            return;
          }

          if (!isIssuedFastCode(fastCode)) {
            console.error(
              "[claim-market] Refusing ebook redirect without issued FAST Code",
              { requestId, mapsiteId: result.mapsiteId }
            );
            window.alert(
              `Your Build Request was saved (ID: ${requestId}), but a FAST Code was not issued. Please try again — the E-Book generator cannot continue without a FAST Code.`
            );
            return;
          }

          try {
            const opened = await openMapSiteAfterBuildRequest({
              requestId,
              fastCode,
              accountType: result.accountType || null,
              successPath: "self-ebook",
            });
            window.location.assign(opened.href);
          } catch (openError) {
            console.error("[claim-market] Mapsite™ create failed:", openError);
            window.location.assign(
              buildSelfEbookContinueHref({
                requestId,
              })
            );
          }
        })();
      }}
    />
  );
}
