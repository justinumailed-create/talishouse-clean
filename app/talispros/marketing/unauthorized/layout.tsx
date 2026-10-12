import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Access Denied");
}

export default function MarketingUnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
