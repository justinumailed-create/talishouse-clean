import { describe, expect, it } from "vitest";
import {
  CANADA_PROVINCE_CODES,
  CANADA_TAX_RATES,
  CANADA_TAX_RATES_AS_OF,
  canadaTaxWord,
  computeCanadaSalesTax,
  parseCanadaProvince,
  resolvePlaceOfSupplyProvince,
} from "@/lib/canada-sales-tax";
import {
  HISTORICAL_ROOT_ONE_DOLLAR_TAX_RATE,
  PLAN_DETAILS,
  historicalRootOneDollarTotal,
  planSummaryFor,
  registrationTaxAmountFor,
  registrationTotalFor,
} from "@/lib/registration-plans";

const EXPECTED_COMBINED: Record<string, number> = {
  AB: 0.05,
  BC: 0.12,
  MB: 0.12,
  SK: 0.11,
  QC: 0.14975,
  ON: 0.13,
  NS: 0.14,
  NB: 0.15,
  NL: 0.15,
  PE: 0.15,
  NT: 0.05,
  NU: 0.05,
  YT: 0.05,
};

describe("Canada GST/HST/PST table", () => {
  it("covers all 13 provinces and territories with CRA 2025-04-01 rates", () => {
    expect(CANADA_TAX_RATES_AS_OF).toBe("2025-04-01");
    expect(CANADA_PROVINCE_CODES).toHaveLength(13);
    for (const [code, combined] of Object.entries(EXPECTED_COMBINED)) {
      expect(CANADA_TAX_RATES[code as keyof typeof CANADA_TAX_RATES].combinedRate).toBe(
        combined,
      );
    }
  });

  it("uses GST on price + QST on price for Quebec (not QST on GST)", () => {
    const qc = computeCanadaSalesTax(100, "QC");
    expect(qc.gstAmount).toBe(5);
    expect(qc.provincialAmount).toBe(9.98);
    expect(qc.taxAmount).toBe(14.98);
    expect(qc.total).toBe(114.98);
    expect(qc.taxWord).toBe("GST + QST");
  });

  it("labels HST, GST, and GST + provincial taxes correctly", () => {
    expect(canadaTaxWord(CANADA_TAX_RATES.ON)).toBe("HST");
    expect(canadaTaxWord(CANADA_TAX_RATES.AB)).toBe("GST");
    expect(canadaTaxWord(CANADA_TAX_RATES.BC)).toBe("GST + PST");
    expect(canadaTaxWord(CANADA_TAX_RATES.MB)).toBe("GST + RST");
    expect(canadaTaxWord(CANADA_TAX_RATES.QC)).toBe("GST + QST");
  });
});

describe("parseCanadaProvince", () => {
  it("accepts codes, names, and address fragments", () => {
    expect(parseCanadaProvince("on")).toBe("ON");
    expect(parseCanadaProvince("Nova Scotia")).toBe("NS");
    expect(parseCanadaProvince("Québec")).toBe("QC");
    expect(parseCanadaProvince("PEI")).toBe("PE");
    expect(
      parseCanadaProvince("8787 Woodbine Ave, Markham, ON L3R 5W9, Canada"),
    ).toBe("ON");
    expect(
      parseCanadaProvince(
        "Lot 8, South Head Road, Homeville, Nova Scotia, Canada.",
      ),
    ).toBe("NS");
    expect(parseCanadaProvince("Calgary, Alberta")).toBe("AB");
    expect(parseCanadaProvince("Shop on Queen Street")).toBeNull();
    expect(parseCanadaProvince("n/a")).toBeNull();
    expect(parseCanadaProvince("")).toBeNull();
  });

  it("prefers the first valid place-of-supply candidate", () => {
    expect(resolvePlaceOfSupplyProvince(null, "", "NS", "ON")).toBe("NS");
    expect(resolvePlaceOfSupplyProvince("unknown", "Manitoba")).toBe("MB");
  });
});

describe("Root Account™ sample prices", () => {
  const root = PLAN_DETAILS.ROOT_ACCOUNT.price;

  it("computes Root $998.50 in ON vs AB vs QC", () => {
    expect(root).toBe(998.5);

    const on = computeCanadaSalesTax(root, "ON");
    expect(on.taxAmount).toBe(129.81);
    expect(on.total).toBe(1128.31);
    expect(on.taxWord).toBe("HST");
    expect(registrationTotalFor(root, "ON")).toBe(1128.31);
    expect(registrationTaxAmountFor(root, "ON")).toBe(129.81);

    const ab = computeCanadaSalesTax(root, "AB");
    expect(ab.taxAmount).toBe(49.93);
    expect(ab.total).toBe(1048.43);
    expect(ab.taxWord).toBe("GST");

    const qc = computeCanadaSalesTax(root, "QC");
    expect(qc.gstAmount).toBe(49.93);
    expect(qc.provincialAmount).toBe(99.6);
    expect(qc.taxAmount).toBe(149.53);
    expect(qc.total).toBe(1148.03);
    expect(qc.taxWord).toBe("GST + QST");
  });

  it("builds plan summaries with the provincial tax word, not a flat GST label", () => {
    const on = planSummaryFor("ROOT_ACCOUNT", "ON");
    expect(on.taxLabel).toBe("CAD $129.81 HST");
    expect(on.totalLabel).toBe("CAD $1128.31 (incl. HST)");

    const bc = planSummaryFor("ROOT_ACCOUNT", "BC");
    expect(bc.taxLabel).toContain("GST + PST");
    expect(bc.tax).toBe(119.83);
  });

  it("covers every jurisdiction for the Root price", () => {
    for (const code of CANADA_PROVINCE_CODES) {
      const breakdown = computeCanadaSalesTax(root, code);
      expect(breakdown.taxAmount).toBeGreaterThan(0);
      expect(breakdown.total).toBe(root + breakdown.taxAmount);
      expect(breakdown.province).toBe(code);
    }
  });
});

describe("historical $1 Root matching", () => {
  it("keeps CAD $1.00 + 14% GST for already-paid sessions", () => {
    expect(HISTORICAL_ROOT_ONE_DOLLAR_TAX_RATE).toBe(0.14);
    expect(historicalRootOneDollarTotal()).toBe(1.14);
    const summary = planSummaryFor("ROOT_ACCOUNT_1");
    expect(summary.price).toBe(1);
    expect(summary.tax).toBe(0.14);
    expect(summary.total).toBe(1.14);
    expect(summary.taxLabel).toContain("GST");
  });
});
