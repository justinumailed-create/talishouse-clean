import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Build A MapSite™ | TalisPros™",
  description:
    "Industry Adjacent Market Places for Real Estate Professionals. Create your MapSite™ — a done-for-you property discovery page.",
};

export default function BuildMapsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
