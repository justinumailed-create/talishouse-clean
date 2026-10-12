import TalisMapsEditorShell from "@/components/talismaps/editor/TalisMapsEditorShell";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Talismaps™ Editor");
}

export default function TalisMapsEditorPage() {
  return <TalisMapsEditorShell />;
}
