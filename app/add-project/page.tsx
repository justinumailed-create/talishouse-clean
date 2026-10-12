import AddProjectPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/add-project");
}

export default function Page() {
  return <AddProjectPage />;
}
