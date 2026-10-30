import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fast Code Generator | Tsplits™",
  description: "Generate your unique Fast Code to access your Tsplits™ Mapsite.",
};

export default function FastCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
