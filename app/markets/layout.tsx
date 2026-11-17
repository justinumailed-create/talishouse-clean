import type { ReactNode } from "react";
import TalisUChrome from "@/components/talisu/TalisUChrome";

export default function MarketsLayout({ children }: { children: ReactNode }) {
  return <TalisUChrome>{children}</TalisUChrome>;
}
