import type { Metadata } from "next";
import { Suspense } from "react";
import { Libre_Baskerville } from "next/font/google";
import TalisprosGatePage from "@/components/talispros/TalisprosGatePage";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";
import { SAMCART_SUCCESS_RETURN_PATH } from "@/lib/talispros/samcart-return";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const startTitle = "Talispros™ | Login & System Demo";

export const metadata: Metadata = createMetadata({
  title: startTitle,
  description:
    "Login to your Talispros™ account with a FAST Code™, or open the System Demo. SamCart checkout returns here after payment.",
  path: SAMCART_SUCCESS_RETURN_PATH,
  image: talisprosBrandOgMetadataImage(startTitle),
});

export default function StartGatePage() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <Suspense fallback={null}>
        <TalisprosGatePage />
      </Suspense>
    </div>
  );
}
