"use client";

import { useRouter } from "next/navigation";
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
  returnTo,
}: ClaimMarketRegistrationClientProps) {
  const router = useRouter();

  return (
    <TalisprosMarketRegistrationForm
      market={market}
      mapsiteId={mapsiteId}
      variant="page"
      onSuccess={(result) => {
        const params = new URLSearchParams({
          claimed: "1",
          mapsiteId,
          audience: market,
        });
        if (result.fastCode) {
          params.set("fastCode", result.fastCode);
        }
        if (result.requestId) {
          params.set("requestId", result.requestId);
        }
        const base =
          returnTo.startsWith(MAPSITE_APP_PATH) || returnTo === MAPSITE_APP_PATH
            ? MAPSITE_APP_PATH
            : MAPSITE_APP_PATH;
        router.push(`${base}?${params.toString()}`);
      }}
    />
  );
}
