import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = createMetadata({
  title: "Register Your Mapsite™ | Talispros™",
  description:
    "Choose your account level and activate your Mapsite™ through secure online registration.",
  path: "/talispros/register",
});

export default function TalisprosRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
