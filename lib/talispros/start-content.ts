import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export function isTalisprosStartPath(pathname: string | null | undefined) {
  return pathname === "/" || pathname === "/talispros/start";
}

export const TALISPROS_LEGAL_PRIMARY_COPY =
  "Differentiate locally and develop a real estate adjacent marketing platform by using Mapsites™️ that promote qualifying inventory.*";

export const TALISPROS_LEGAL_SECONDARY_COPY = "Some Limitations apply";

export const TALISPROS_HOME_PRODUCTS = [
  {
    id: "g-house",
    label: "G-House",
    imageSrc: "/talisbooks/templates/rm22/products/g-house.jpg",
  },
  {
    id: "t-house",
    label: "T-House",
    imageSrc: "/talisbooks/templates/rm22/products/t-house.jpg",
  },
  {
    id: "t-dome",
    label: "T-Dome",
    imageSrc: "/talisbooks/templates/rm22/products/t-dome.jpg",
  },
] as const;

export const TALISPROS_START_SEGMENTS = [
  {
    label: "Broker",
    title: "I am a Broker or Team Leader",
    href: `${MAPSITE_APP_PATH}?audience=brokers&accountType=root`,
  },
  {
    label: "Professional",
    title: "I am a Real Estate Professional",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
  },
  {
    label: "FSBO",
    title: "I am a For-Sale-By-Owner Seller",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
  },
  {
    label: "Adpros",
    title: "I am an Adpros Service Provider",
    href: `${MAPSITE_APP_PATH}?audience=adpro`,
  },
] as const;
