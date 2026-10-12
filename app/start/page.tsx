import { Suspense } from "react";
import { Libre_Baskerville } from "next/font/google";
import TalisprosStartPage from "@/components/talispros/TalisprosStartPage";
import TalisprosSamCartPathRedirect from "@/components/talispros/TalisprosSamCartPathRedirect";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/start");
}

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
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
