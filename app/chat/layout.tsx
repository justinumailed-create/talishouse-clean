import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#1E4ED8",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  manifest: "/chat.webmanifest",
  appleWebApp: { capable: true, title: "Talispros Chat", statusBarStyle: "default" },
  icons: { apple: "/chat-icon-192.png" },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="chat-app fixed inset-0 h-[100dvh] overflow-hidden bg-[#f6f8fb] text-[#0f172a]">{children}</div>;
}
