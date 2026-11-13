import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Wholesale Partner Access | Tsplits™",
  description: "Access dedicated Tsplits™ Mapsites using Fast Codes.",
  keywords: [
    "TalisHouse",
    "Tsplits",
    "Fast Code",
    "Mapsite",
    "Partner Access",
    "Geospatial Platform",
    "Lead Generation",
    "Business Mapping",
    "Location Intelligence",
    "Wholesale Partner Portal",
    "Mapsite Access",
    "Dynamic Access Routing",
    "Enterprise Mapping",
    "Location Platform",
    "Tsplits Mapsites"
  ],
  alternates: {
    canonical: "https://www.talishouse.com/partner-access",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Wholesale Partner Access | Tsplits™",
    description: "Access dedicated Tsplits™ Mapsites using Fast Codes.",
    url: "https://www.talishouse.com/partner-access",
    siteName: "TalisHouse",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og/pages/partner-access-en.jpg",
        width: 1200,
        height: 630,
        alt: "Wholesale Partner Access | Tsplits™",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale Partner Access | Tsplits™",
    description: "Access dedicated Tsplits™ Mapsites using Fast Codes.",
    images: ["/og/pages/partner-access-en.jpg"],
  },
};

export default function PartnerAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
