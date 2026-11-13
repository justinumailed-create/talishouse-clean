import type { Metadata } from "next";
import "../globals.css";
import TalisMapsLayoutClient from "@/components/talismaps/platform/TalisMapsLayoutClient";
import { poppins } from "@/lib/fonts";
import { TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: `${TALISMAPS_PRODUCT_NAME} | Interactive Map Platform`,
  description:
    "Talismaps™ is the native interactive map platform for the Tsplits™ ecosystem — replacing Atlist with root accounts, derivative maps, Adpro PINs, and property listings.",
  path: "/talismaps",
});

export default function TalisMapsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={poppins.className}>
      <TalisMapsLayoutClient>{children}</TalisMapsLayoutClient>
    </div>
  );
}
