import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import TalisprosStartPage from "@/components/talispros/TalisprosStartPage";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const homeTitle = "Talispros™ | Claim your market";

export const metadata: Metadata = createMetadata({
  title: homeTitle,
  description:
    "Claim your market on Talispros™. Mapsite™ pins your place on the map so buyers and partners can find you — Explore Talisbooks™ and grow your exposure worldwide.",
  path: "/",
  image: talisprosBrandOgMetadataImage(homeTitle),
});

export default function Home() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <TalisprosStartPage />
    </div>
  );
}
