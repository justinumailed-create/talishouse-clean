import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Register Your MapSite™ | TalisPros™",
  description:
    "Register your MapSite™ account and activate your TalisPros™ presence with payment.",
};

export default function TalisprosRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
