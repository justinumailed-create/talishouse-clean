import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import TalisprosStartPage from "@/components/talispros/TalisprosStartPage";
import { createMetadata } from "@/lib/seo";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = createMetadata({
  title: "Talispros™ | Claim your market",
  description:
    "Claim your market on Talispros™. Mapsite™ pins your place on the map so buyers and partners can find you — Explore Talisbooks™ and grow your exposure worldwide.",
  path: "/",
  image: {
    url: "/seo/talispros-og.jpg",
    width: 579,
    height: 1024,
    alt: "Talispros™ Mapsite™",
  },
});

export default function Home() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <TalisprosStartPage />
    </div>
  );
}
