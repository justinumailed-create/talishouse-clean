import CrmLayout from "./layout-client";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("CRM");
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CrmLayout>{children}</CrmLayout>;
}
