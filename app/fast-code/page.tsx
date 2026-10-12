import FastCodeGeneratorPage from "./page-client";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/fast-code");
}

export default function Page() {
  return <FastCodeGeneratorPage />;
}
