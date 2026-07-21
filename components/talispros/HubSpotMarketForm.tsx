"use client";

import Script from "next/script";

interface HubSpotMarketFormProps {
  formId: string;
}

export default function HubSpotMarketForm({ formId }: HubSpotMarketFormProps) {
  return (
    <>
      <Script
        src="https://js-na3.hsforms.net/forms/embed/342932996.js"
        strategy="afterInteractive"
      />
      <div
        className="hs-form-frame mx-auto w-full max-w-3xl px-4 sm:px-6"
        data-region="na3"
        data-form-id={formId}
        data-portal-id="342932996"
      />
    </>
  );
}
