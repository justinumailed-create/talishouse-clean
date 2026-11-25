import ClientAppEntry from "@/components/talispros/ClientAppEntry";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/app");
}

export const dynamic = "force-dynamic";

export default function ClientAppPage() {
  return <ClientAppEntry />;
}
