import DisqualifyBrokerageControl from "@/components/admin/agents/DisqualifyBrokerageControl";
import { listActiveDisqualifications, listMarketSourceGaps } from "@/lib/talispros/market-disqualify-server";
import { BROKERAGES_PER_MARKET_TARGET } from "@/lib/talispros/market-disqualify";

const COPY = {
  en: {
    title: "Markets to source",
    hint: `A market should keep about ${BROKERAGES_PER_MARKET_TARGET} candidate brokerages so there is a fallback.`,
    emptyOk: "Every sourced market still has a qualified brokerage.",
    needs: (market: string) =>
      `${market} has no qualified brokerage left. Source the next one.`,
    short: (market: string, n: number) =>
      `${market} has ${n} of ${BROKERAGES_PER_MARKET_TARGET} qualified brokerages.`,
    disqualified: "Disqualified brokerages",
    none: "None right now.",
    by: "By",
    reason: "Reason",
    restoreHint: "A Global Admin can restore a brokerage. Nothing is deleted.",
  },
  de: {
    title: "Märkte zur Recherche",
    hint: `Ein Markt sollte etwa ${BROKERAGES_PER_MARKET_TARGET} Kandidaten-Maklerbüros behalten, damit es einen Ersatz gibt.`,
    emptyOk: "Jeder recherchierte Markt hat noch ein qualifiziertes Maklerbüro.",
    needs: (market: string) => `${market} hat kein qualifiziertes Maklerbüro mehr. Das nächste recherchieren.`,
    short: (market: string, n: number) =>
      `${market} hat ${n} von ${BROKERAGES_PER_MARKET_TARGET} qualifizierten Maklerbüros.`,
    disqualified: "Disqualifizierte Maklerbüros",
    none: "Im Moment keine.",
    by: "Von",
    reason: "Grund",
    restoreHint: "Ein Globaler Admin kann ein Maklerbüro wieder aufnehmen. Nichts wird gelöscht.",
  },
} as const;

export default async function MarketSourcePanel({
  locale,
  canReverse,
}: {
  locale: "en" | "de";
  canReverse: boolean;
}) {
  const copy = COPY[locale];
  const [gaps, active] = await Promise.all([
    listMarketSourceGaps().catch(() => []),
    listActiveDisqualifications().catch(() => []),
  ]);
  const urgent = gaps.filter((gap) => gap.needsNext);
  const short = gaps.filter((gap) => !gap.needsNext);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" data-testid="market-source-panel">
      <h2 className="text-[15px] font-semibold text-neutral-900">{copy.title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{copy.hint}</p>
      {urgent.length ? (
        <ul className="mt-3 space-y-2">
          {urgent.map((gap) => (
            <li key={gap.market} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950" data-testid="market-needs-brokerage">
              {copy.needs(gap.market)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-neutral-600">{copy.emptyOk}</p>
      )}
      {short.length ? (
        <ul className="mt-3 space-y-1 text-sm text-neutral-700">
          {short.map((gap) => (
            <li key={gap.market}>{copy.short(gap.market, gap.qualified)}</li>
          ))}
        </ul>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold text-neutral-900">{copy.disqualified}</h3>
      <p className="mt-1 text-sm text-neutral-600">{copy.restoreHint}</p>
      {active.length === 0 ? <p className="mt-2 text-sm text-neutral-500">{copy.none}</p> : null}
      <ul className="mt-3 space-y-3">
        {active.map((row) => (
          <li key={row.id} className="rounded-xl border border-neutral-200 p-3 text-sm" data-testid="disqualified-brokerage">
            <p className="font-semibold text-neutral-900">
              {row.brokerage}
              {row.fastCode ? <span className="ml-2 font-mono text-xs uppercase text-[#1E4ED8]">{row.fastCode}</span> : null}
            </p>
            {row.market ? <p className="text-neutral-600">{row.market}</p> : null}
            <p className="mt-1 text-neutral-800">
              {copy.reason}: {row.reason}
            </p>
            <p className="text-neutral-500">
              {copy.by} {row.actorName}
            </p>
            {canReverse ? (
              <DisqualifyBrokerageControl
                locale={locale}
                mode="restore"
                fastCode={row.fastCode}
                prospectQueueId={row.prospectQueueId}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
