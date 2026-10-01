import type { Metadata } from "next";
import { Suspense } from "react";
import { Libre_Baskerville } from "next/font/google";
import TalisprosStartPage from "@/components/talispros/TalisprosStartPage";
import TalisprosSamCartPathRedirect from "@/components/talispros/TalisprosSamCartPathRedirect";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const startTitle = "Talispros™ | Claim your market";

export const metadata: Metadata = createMetadata({
  title: startTitle,
  description:
    "Claim your market on Talispros™. Mapsite™ pins your place on the map so buyers and partners can find you — Explore Talisbooks™ and grow your exposure worldwide.",
  path: "/start",
  image: talisprosBrandOgMetadataImage(startTitle),
});

/** Former homepage content — bookmarks to `/start` still land here. */
export default function StartPage() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <Suspense fallback={null}>
        <TalisprosSamCartPathRedirect />
      </Suspense>
      <TalisprosStartPage />
    </div>
  );
}
