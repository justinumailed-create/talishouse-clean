import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Build A Mapsite™ | Talispros™",
  description:
    "Build a done-for-you Mapsite™ without obligation. We will follow up within two business days to optimize and publish.",
};

export default function BuildMapSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
