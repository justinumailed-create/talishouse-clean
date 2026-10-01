"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isSamCartPaymentReturn,
  parseSamCartReturnParams,
} from "@/lib/talispros/samcart-return";

/**
 * Legacy SamCart Custom URLs pointed at `/start`. After the route swap the
 * gate (and return banner) live on `/` — forward order returns there.
 */
export default function TalisprosSamCartPathRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    if (!isSamCartPaymentReturn(parseSamCartReturnParams(raw))) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }, [router, searchParams]);

  return null;
}
