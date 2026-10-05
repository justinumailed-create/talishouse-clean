import type { ReactNode } from "react";
import TalisUChrome from "@/components/talisu/TalisUChrome";
import { createTalisUMetadata } from "@/lib/talisu/seo";

export const metadata = createTalisUMetadata({
  title: "TalisU™",
  description:
    "Industry adjacent fulfilment options — Conventional, SPLITS, Fractionalization, and Tokenization.",
  path: "/talisu",
});

export default function TalisULayout({ children }: { children: ReactNode }) {
  return <TalisUChrome>{children}</TalisUChrome>;
}
