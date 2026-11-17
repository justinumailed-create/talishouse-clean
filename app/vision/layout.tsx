import type { ReactNode } from "react";
import TalisUChrome from "@/components/talisu/TalisUChrome";

export default function VisionLayout({ children }: { children: ReactNode }) {
  return <TalisUChrome>{children}</TalisUChrome>;
}
