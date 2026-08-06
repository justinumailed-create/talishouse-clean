// ⚠️ DEPRECATED — Use /talispros/register instead.
// Kept for backward compatibility; will be removed in a future release.

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Register Your Mapsite™ | TalisPros™",
  description: "Register your Mapsite™ account and activate your TalisPros™ presence.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
