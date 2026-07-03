import { describe, expect, it } from "vitest";
import {
  aggregateWeeklyReport,
  getPreviousWeekRange,
} from "@/lib/weekly-report-generator";

describe("weekly-report-generator", () => {
  it("aggregates daily metrics into weekly totals", () => {
    const result = aggregateWeeklyReport("lrg1", "2026-06-23", "2026-06-29", [
      {
        reportDate: "2026-06-23",
        facebookImpressions: 1000,
        instagramImpressions: 500,
        totalReach: 1500,
        emailsReceived: 2,
        textsReceived: 1,
        pipelineStatus: "active",
      },
      {
        reportDate: "2026-06-24",
        facebookImpressions: 1200,
        instagramImpressions: 800,
        totalReach: 2000,
        emailsReceived: 3,
        textsReceived: 2,
        pipelineStatus: "nurturing",
      },
    ]);

    expect(result.facebookImpressionsTotal).toBe(2200);
    expect(result.instagramImpressionsTotal).toBe(1300);
    expect(result.totalReachTotal).toBe(3500);
    expect(result.emailsReceivedTotal).toBe(5);
    expect(result.textsReceivedTotal).toBe(3);
    expect(result.pipelineStatus).toBe("nurturing");
    expect(result.summaryText).toContain("LRG1");
    expect(result.summaryText).toContain("Pipeline: Nurturing");
  });

  it("returns a seven-day previous week range ending yesterday", () => {
    const reference = new Date("2026-06-30T12:00:00");
    const { weekStart, weekEnd } = getPreviousWeekRange(reference);

    expect(weekStart).toBe("2026-06-23");
    expect(weekEnd).toBe("2026-06-29");
  });
});
