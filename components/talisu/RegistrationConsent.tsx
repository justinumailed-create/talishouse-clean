"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";

/** Shown beside registration and checkout. Registering agrees to the Terms. */
export default function RegistrationConsent({
  className = "",
}: {
  className?: string;
}) {
  const labels = useT().talisu.register.actions;
  return (
    <p
      className={`text-center text-[13px] leading-relaxed text-neutral-600 ${className}`}
      data-testid="registration-consent"
    >
      {labels.consentBefore}{" "}
      <Link href="/terms" className="font-semibold text-[#046BD9] underline-offset-2 hover:underline">
        {labels.consentTerms}
      </Link>{" "}
      {labels.consentAnd}{" "}
      <Link href="/privacy" className="font-semibold text-[#046BD9] underline-offset-2 hover:underline">
        {labels.consentPrivacy}
      </Link>
      {labels.consentAfter}
    </p>
  );
}
