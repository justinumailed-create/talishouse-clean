import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TALISBOOKS_BROKERAGE_DEMO_AGENT } from "@/lib/talisbooks/viewer/brokerage-scaffold";
import {
  MARKETING_PARTNER_TELEGRAM_HREF,
  MARKETING_PARTNER_WHATSAPP_HREF,
  RALF_CONTACT_PHONE_DISPLAY,
  RALF_CONTACT_PHONE_E164,
} from "@/lib/talispros/marketing-partner-contact";

describe("marketing partner contact", () => {
  it("uses Ralf’s existing phone for WhatsApp and Telegram", () => {
    expect(RALF_CONTACT_PHONE_DISPLAY.replace(/\D/g, "")).toBe(
      TALISBOOKS_BROKERAGE_DEMO_AGENT.phone.replace(/\D/g, ""),
    );
    expect(RALF_CONTACT_PHONE_E164).toBe("19023172223");
    expect(MARKETING_PARTNER_WHATSAPP_HREF).toBe("https://wa.me/19023172223");
    expect(MARKETING_PARTNER_TELEGRAM_HREF).toBe("https://t.me/+19023172223");
  });

  it("keeps Marketing Partner Express an Interest on Mapsite cards only", () => {
    const card = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MapSiteMarketPartnerCard.tsx",
      ),
      "utf8",
    );
    const sidebar = readFileSync(
      join(process.cwd(), "components/talispros/TalisprosMarketSidebar.tsx"),
      "utf8",
    );
    const links = readFileSync(
      join(
        process.cwd(),
        "components/talispros/mapsite/MarketingPartnerInterestLinks.tsx",
      ),
      "utf8",
    );

    expect(card).toContain("MarketingPartnerInterestLinks");
    expect(card).not.toContain("What we do for you");
    expect(sidebar).toContain("Your Mapsite™ Manager:");
    expect(sidebar).toContain("What we do for you");
    expect(sidebar).not.toContain("MarketingPartnerInterestLinks");
    expect(sidebar).not.toContain("MARKETING_PARTNER_ROLE_LABEL");
    expect(links).toContain("Express an Interest");
    expect(links).toContain("MARKETING_PARTNER_WHATSAPP_HREF");
    expect(links).toContain("MARKETING_PARTNER_TELEGRAM_HREF");
  });
});