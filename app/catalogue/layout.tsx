import CatalogueLayoutClient from "@/components/catalogue/CatalogueLayoutClient";

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CatalogueLayoutClient>{children}</CatalogueLayoutClient>;
}
