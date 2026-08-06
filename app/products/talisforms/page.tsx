import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "TalisForms™ | Forms Infrastructure For Talispros™",
  description:
    "The forms engine powering Talispros™, Mapsites™, FAST Codes™, registrations, onboarding workflows, and partner applications.",
  path: "/products/talisforms",
});

export default function TalisFormsRedirect() {
  redirect("/talispros/forms");
}
