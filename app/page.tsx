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
    width: 1200,
    height: 630,
    alt: "Talispros™ — Claim your market with Mapsite™",
  },
});

export default function Home() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <TalisprosStartPage />
    </div>
  );
}
