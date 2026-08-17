import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import TalisprosStartPage from "@/components/talispros/TalisprosStartPage";
import { createMetadata } from "@/lib/seo";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = createMetadata({
  title: "Talispros™ | Choose your Mapsite™...",
  description:
    "Talispros™ provides Mapsites™ as alternative Market Places around Talishouse™ Homes and Cottages.",
  path: "/",
});

export default function Home() {
  return (
    <div className={`${libreBaskerville.className} min-h-dvh lg:h-full lg:min-h-0`}>
      <TalisprosStartPage />
    </div>
  );
}
