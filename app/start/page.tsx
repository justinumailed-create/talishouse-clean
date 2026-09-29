import type { Metadata } from "next";
import { Suspense } from "react";
import { Libre_Baskerville } from "next/font/google";
import TalisprosGatePage from "@/components/talispros/TalisprosGatePage";
import { createMetadata } from "@/lib/seo";
import { toAbsoluteHttpsOgUrl } from "@/lib/talispros/mapsite-og-image";
import { SAMCART_SUCCESS_RETURN_PATH } from "@/lib/talispros/samcart-return";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const startTitle = "Talispros™";
const startDescription = "Claim your market. Open your Mapsite™.";

export const metadata: Metadata = createMetadata({
  title: startTitle,
  description: startDescription,
  path: SAMCART_SUCCESS_RETURN_PATH,
  image: {
    url: toAbsoluteHttpsOgUrl("/assets/start-og.png"),
    width: 690,
    height: 686,
    alt: startTitle,
  },
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
