import type { Metadata } from "next";
import "./globals.css";
import NotFoundView from "@/components/NotFoundView";
import { poppins } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "404 | Talishouse",
  description: "The page you are looking for does not exist.",
};

/**
 * Unmatched URLs only (experimental.globalNotFound). Bypasses root layout /
 * RootShell entirely — no Talishouse navbar, cart, or Talisbot.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <NotFoundView />
      </body>
    </html>
  );
}
