import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Build A MapSite | TalisPros",
  description:
    "Build a done-for-you MapSite without obligation. We will follow up within two business days to optimize and publish.",
};

export default function BuildMapsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
