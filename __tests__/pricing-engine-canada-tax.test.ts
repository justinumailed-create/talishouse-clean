import { describe, expect, it } from "vitest";
import { calculateTotal } from "@/lib/utils/pricingEngine";

describe("pricingEngine Canada tax", () => {
  it("applies provincial GST/HST/PST instead of a global rate", () => {
    const on = calculateTotal({ basePrice: 1000, province: "ON" });
    expect(on.taxRate).toBe(0.13);
    expect(on.taxAmount).toBe(130);
    expect(on.taxLabel).toBe("HST");
    expect(on.total).toBe(1130);

    const ab = calculateTotal({ basePrice: 1000, province: "AB" });
    expect(ab.taxRate).toBe(0.05);
    expect(ab.taxLabel).toBe("GST");
    expect(ab.total).toBe(1050);

    const qc = calculateTotal({ basePrice: 1000, province: "QC" });
    expect(qc.taxLabel).toBe("GST + QST");
    expect(qc.taxAmount).toBe(149.75);
    expect(qc.total).toBe(1149.75);
  });

  it("does not invent 14% when province is missing", () => {
    const pending = calculateTotal({ basePrice: 1000 });
    expect(pending.taxRate).toBe(0);
    expect(pending.taxAmount).toBe(0);
    expect(pending.total).toBe(1000);
  });
});
