import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import EbookGenerateClient from "@/components/talispros/EbookGenerateClient";
import { resolveOnboardingFromRequest } from "@/lib/talispros/resolve-onboarding-from-request";
import {
  logOnboardingFailure,
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";

export const dynamic = "force-dynamic";

/** Image encode + storage uploads need more than the default serverless window. */
export const maxDuration = 60;

export const metadata: Metadata = createMetadata({
  title: "Generate E-Book | Talispros™",
  description:
    "Generate your own TalisBooks™ E-Book from property images, title, description, and location — no payment required.",
  path: "/talispros/ebook-generate",
  private: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EbookGeneratePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const pageStarted = onboardingNow();
  const params = await searchParams;
  const requestId = firstParam(params.requestId)?.trim() || null;

  // requestId is canonical. Legacy query params are never trusted for business state.
  const resolved = await resolveOnboardingFromRequest(requestId);

  if (!resolved.ok) {
    logOnboardingFailure(resolved.report);
    logOnboardingStep("Ebook page load", pageStarted, {
      failed: true,
      stage: resolved.report.stage,
      requestId,
    });

    return (
      <EbookGenerateClient
        requestId={requestId}
        fastCode={null}
        mapsiteId={null}
        accountType={null}
        initialAgentName=""
        initialAgentEmail=""
        initialAgentPhone=""
        bootstrapError={resolved.report.error}
        bootstrapMeta={{
          requestId: resolved.report.requestId,
          fastCode: resolved.report.fastCode,
          mapsiteId: resolved.report.mapsiteId,
          stage: resolved.report.stage,
        }}
      />
    );
  }

  const { context } = resolved;
  logOnboardingStep("Ebook page load", pageStarted, {
    requestId: context.requestId,
    fastCode: context.fastCode,
    mapsiteId: context.mapsiteId,
  });

  return (
    <EbookGenerateClient
      requestId={context.requestId}
      fastCode={context.fastCode}
      mapsiteId={context.mapsiteId}
      accountType={context.accountType}
      initialAgentName={context.owner.agentName}
      initialAgentEmail={context.owner.email}
      initialAgentPhone={context.owner.phone}
    />
  );
}
