import { notFound } from "next/navigation";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { createDemoViewerBook } from "@/lib/talisbooks/viewer";

interface TalisBooksViewerSlugPageProps {
  params: Promise<{ slug: string }>;
}

const DEMO_SLUGS = new Set(["sample-ebook", "demo", "preview"]);

export default async function TalisBooksViewerSlugPage({
  params,
}: TalisBooksViewerSlugPageProps) {
  const { slug } = await params;
  const demo = createDemoViewerBook();

  // Future: load published book by slug from talisbooks_books.
  // Demo slugs keep the viewer usable before catalog data exists.
  if (!DEMO_SLUGS.has(slug)) {
    notFound();
  }

  return <TalisBooksViewerShell book={{ ...demo, slug: demo.slug }} />;
}
