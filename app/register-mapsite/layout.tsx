// ⚠️ DEPRECATED — Use /talispros/register instead.
// Kept for backward compatibility; will be removed in a future release.

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Register Your MapSite | TalisPros™",
  description: "Register your MapSite and activate your TalisPros™ presence with payment.",
};

export default function RegisterMapsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
