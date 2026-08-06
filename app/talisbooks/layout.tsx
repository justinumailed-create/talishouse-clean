import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import TalisBooksLayoutClient from "@/components/talisbooks/platform/TalisBooksLayoutClient";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = createMetadata({
  title: `${TALISBOOKS_PRODUCT_NAME} | Digital Book Platform`,
  description:
    "Talisbooks™ is the native digital book and lookbook engine for the Talispros™ ecosystem — books, pages, templates, layouts, and publish workflows.",
  path: "/talisbooks",
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
