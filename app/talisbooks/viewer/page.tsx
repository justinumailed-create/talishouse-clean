import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { createDemoViewerBook } from "@/lib/talisbooks/viewer";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisbooks/viewer");
}

export default function TalisBooksViewerPage() {
  const book = createDemoViewerBook();

  return <TalisBooksViewerShell book={book} />;
}
