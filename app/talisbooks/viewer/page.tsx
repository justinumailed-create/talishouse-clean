import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { createDemoViewerBook } from "@/lib/talisbooks/viewer";

export default function TalisBooksViewerPage() {
  const book = createDemoViewerBook();

  return <TalisBooksViewerShell book={book} />;
}
