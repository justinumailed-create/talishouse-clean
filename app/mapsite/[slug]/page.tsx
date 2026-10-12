import PublishedMapSiteView, {
  loadPublishedMapSiteView,
  publishedMapSiteMetadata,
} from "@/components/mapsite/PublishedMapSiteView";
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug?.toLowerCase().trim();
  if (!slug) {
    return { title: "Mapsite" };
  }
  const published = await loadPublishedMapSiteView(slug);
  if (published) {
    return await publishedMapSiteMetadata(published);
  }
  return { title: "Mapsite" };
}

export default async function MapSitePage({ params }: { params: Promise<{ slug?: string }> }) {
  await connection();

  const resolvedParams = await params;
  const slug = resolvedParams?.slug?.toLowerCase().trim();

  if (slug && isAllPinsFastCode(slug)) {
    redirect(ROUTES.TALISU_MARKETS);
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Mapsite Slug</h1>
          <p className="text-gray-600">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  const published = await loadPublishedMapSiteView(slug);
  if (published) {
    return <PublishedMapSiteView mapsite={published} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Mapsite Not Found</h1>
        <p className="text-gray-600">The requested Mapsite could not be located.</p>
      </div>
    </div>
  );
}
