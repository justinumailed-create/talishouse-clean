import type { Metadata } from "next";
import "../globals.css";
import TalisBooksLayoutClient from "@/components/talisbooks/platform/TalisBooksLayoutClient";
import { poppins } from "@/lib/fonts";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: `${TALISBOOKS_PRODUCT_NAME} | Digital Book Platform`,
  description:
    "Talisbooks™ is the native digital book and lookbook engine for the Tsplits™ ecosystem — books, pages, templates, layouts, and publish workflows.",
  path: "/talisbooks",
  image: false,
});

export default function TalisBooksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={poppins.className}>
      <TalisBooksLayoutClient>{children}</TalisBooksLayoutClient>
    </div>
  );
}
