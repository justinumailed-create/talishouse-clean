// ⚠️ DEPRECATED — Target of /register-mapsite only. Use /talispros/register instead.
// Kept for backward compatibility; will be removed in a future release.

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Registration Successful | TalisPros™",
  description: "Your Mapsite™ has been created successfully.",
};

export default function RegistrationSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
