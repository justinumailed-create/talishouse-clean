import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export const TALISPROS_START_SLOGAN = "Prospect - Manage - Colaborate";

export const TALISPROS_START_INTRO =
  "Every Mapsite™ automatically includes a Talishouse™ Homes & Cottages market of 50 miles around a centre point with up to 100,000 people population base.";

export const TALISPROS_START_SEGMENTS = [
  {
    title: "I am a Real Estate Broker or Owner",
    href: `${MAPSITE_APP_PATH}?audience=brokers`,
    description:
      "Licensed Real Estate Professionals work beneath me and qualify for SPLITS ads.",
  },
  {
    title: "I am a Real Estate Professional",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
    description:
      "Industry licensed, or not. I place pins on my Mapsite and promote SPLITS ads.",
  },
  {
    title: "I am a For-Sale-By-Owner Seller",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
    description:
      "Promoting my way to professionals and private buyers helps me save on fees.",
  },
  {
    title: "I am an Adpro Service Provider",
    href: `${MAPSITE_APP_PATH}?audience=adpro`,
    description:
      "As Referral Partner or Co-Promoter I work with all of the above to serve their clients.",
  },
] as const;
