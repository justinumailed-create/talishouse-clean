import TalisFormsPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/forms");
}

export default function Page() {
  return <TalisFormsPage />;
}
