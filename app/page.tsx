import { Suspense } from "react";
import TalisprosGatePage from "@/components/talispros/TalisprosGatePage";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/");
}

export default function Home() {
  return (
    <div className="min-h-dvh lg:h-full lg:min-h-0">
      <Suspense fallback={null}>
        <TalisprosGatePage />
      </Suspense>
    </div>
  );
}
