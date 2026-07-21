import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";

export const TALISPROS_START_SLOGAN = "Prospect - Manage - Colaborate";

export const TALISPROS_START_INTRO =
  "Every Mapsite™ automatically includes a Talishouse™ Homes & Cottages market of 50 miles around a centre point with up to 100,000 people population base.";

export const TALISPROS_START_SEGMENTS = [
  {
    title: "I am a licensed Real Estate Professional.",
    href: TALISPROS_MARKET_OPTIONS[0].href,
    description:
      "I want my Mapsite™ to establish service floors for real estate fees and listing term lengths.",
  },
  {
    title: "I build Talishouse™ Homes & Cottages.",
    href: TALISPROS_MARKET_OPTIONS[1].href,
    description:
      "I want my Mapsite™ to market new tiny home objects or projects, globally.",
  },
  {
    title: "I am a For-Sale-By-Owner (FSBO).",
    href: TALISPROS_MARKET_OPTIONS[2].href,
    description:
      "I want my Mapsite™ help me avoid expensive real estate fees and commitments.",
  },
] as const;
