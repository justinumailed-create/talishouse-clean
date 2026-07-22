import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export const TALISPROS_START_SLOGAN = "Prospect - Manage - Colaborate";

export const TALISPROS_START_INTRO =
  "Every Mapsite™ automatically includes a Talishouse™ Homes & Cottages market of 50 miles around a centre point with up to 100,000 people population base.";

export const TALISPROS_START_SEGMENTS = [
  {
    title: "I am a licensed Real Estate Professional.",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
    description:
      "I want my Mapsite™ to establish service floors for real estate fees and listing term lengths.",
  },
  {
    title: "I build Talishouse™ Homes & Cottages.",
    href: `${MAPSITE_APP_PATH}?audience=homes`,
    description:
      "I want my Mapsite™ to market new tiny home objects or projects, globally.",
  },
  {
    title: "I am a For-Sale-By-Owner (FSBO).",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
    description:
      "I want my Mapsite™ help me avoid expensive real estate fees and commitments.",
  },
] as const;
