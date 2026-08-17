import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export function isTalisprosStartPath(pathname: string | null | undefined) {
  return pathname === "/" || pathname === "/talispros/start";
}

export const TALISPROS_START_INTRO =
  "Seen here, a Glasshouse™ optimized for short-term rental purposes. A Mapsite™ of 50 miles around a centre point, or up to 100,000 people population base, is automatically included with every Account.*";

export const TALISPROS_START_SEGMENTS = [
  {
    label: "Broker",
    title: "I am a Broker or Team Leader",
    href: `${MAPSITE_APP_PATH}?audience=brokers&accountType=root`,
    descriptionLines: [
      "Licensed Real Estate",
      "Professionals work for me",
    ] as const,
  },
  {
    label: "Professional",
    title: "I am a Real Estate Professional",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
    descriptionLines: [
      "Builder or Agent — I sell and",
      "broker real estate",
    ] as const,
  },
  {
    label: "FSBO",
    title: "I am a For-Sale-By-Owner Seller",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
    descriptionLines: [
      "I offer real estate and",
      "businesses privately",
    ] as const,
  },
  {
    label: "Adpros",
    title: "I am an Adpros Service Provider",
    href: `${MAPSITE_APP_PATH}?audience=adpro`,
    descriptionLines: [
      "I provide transaction services",
      "for all of the above",
    ] as const,
  },
] as const;
