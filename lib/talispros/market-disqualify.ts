/**
 * Rules for removing a brokerage from one 80 km market.
 * Rows are kept. A Global Admin can restore them.
 */

export const BROKERAGES_PER_MARKET_TARGET = 3;

export type MarketBrokerageRow = {
  id: string;
  market: string;
  status: string;
  fastCode: string | null;
  disqualified: boolean;
};

export function normalizeDisqualifyReason(reason: string | null | undefined): string | null {
  const text = (reason ?? "").trim().replace(/\s+/g, " ");
  if (text.length < 3 || text.length > 500) return null;
  return text;
}

export function isQualifiedBrokerage(row: Pick<MarketBrokerageRow, "status" | "disqualified">): boolean {
  return row.status !== "rejected" && !row.disqualified;
}

export function qualifiedCount(rows: readonly Pick<MarketBrokerageRow, "status" | "disqualified">[]): number {
  return rows.filter(isQualifiedBrokerage).length;
}

/** A sourced market with nobody left to call. */
export function marketNeedsNextBrokerage(
  rows: readonly Pick<MarketBrokerageRow, "status" | "disqualified">[],
): boolean {
  return rows.length > 0 && qualifiedCount(rows) === 0;
}

export type MarketSourceGap = {
  market: string;
  qualified: number;
  total: number;
  needsNext: boolean;
};

export function marketSourceGaps(rows: readonly MarketBrokerageRow[]): MarketSourceGap[] {
  const groups = new Map<string, MarketBrokerageRow[]>();
  for (const row of rows) {
    const market = row.market.trim();
    if (!market) continue;
    const list = groups.get(market) ?? [];
    list.push(row);
    groups.set(market, list);
  }
  return [...groups.entries()]
    .map(([market, group]) => ({
      market,
      qualified: qualifiedCount(group),
      total: group.length,
      needsNext: marketNeedsNextBrokerage(group),
    }))
    .filter((gap) => gap.needsNext || gap.qualified < BROKERAGES_PER_MARKET_TARGET)
    .sort((a, b) => Number(b.needsNext) - Number(a.needsNext) || a.market.localeCompare(b.market));
}
