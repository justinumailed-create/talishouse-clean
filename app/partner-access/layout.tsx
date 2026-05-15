import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "TalisU™ Partner Access | Fast Code MapSite Portal",
  description: "Access dedicated TalisU™ MapSites™ using Fast Codes. Secure onboarding, partner access routing, lead generation workflows, and premium geospatial business experiences powered by TalisHouse.",
  keywords: [
    "TalisHouse",
    "TalisU",
    "Fast Code",
    "MapSite",
    "Partner Access",
    "Geospatial Platform",
    "Lead Generation",
    "Business Mapping",
    "Location Intelligence",
    "Wholesale Partner Portal",
    "MapSite Access",
    "Dynamic Access Routing",
    "Enterprise Mapping",
    "Location Platform",
    "TalisU MapSites"
  ],
  alternates: {
    canonical: "https://www.talishouse.com/partner-access",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TalisU™ Partner Access | Fast Code MapSite Portal",
    description: "Access dedicated TalisU™ MapSites™ using Fast Codes.",
    url: "https://www.talishouse.com/partner-access",
    siteName: "TalisHouse",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og/partner-access-og.jpg",
        width: 1200,
        height: 630,
        alt: "TalisHouse Partner Access",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TalisHouse Partner Access",
    description: "Access dedicated TalisU™ MapSites™ using Fast Codes.",
    images: ["/og/partner-access-og.jpg"],
  },
};

export default function PartnerAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
