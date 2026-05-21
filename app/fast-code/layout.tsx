import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fast Code Generator | TalisPros",
  description: "Generate your unique Fast Code to access your TalisPros MapSite.",
};

export default function FastCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
