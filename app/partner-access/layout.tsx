import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Wholesale Partner Access | TalisU™",
  description: "Access dedicated TalisU™ MapSites™ using Fast Codes.",
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
    title: "Wholesale Partner Access | TalisU™",
    description: "Access dedicated TalisU™ MapSites™ using Fast Codes.",
    url: "https://www.talishouse.com/partner-access",
    siteName: "TalisHouse",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/seo/partner-access-og.png",
        width: 1200,
        height: 630,
        alt: "Wholesale Partner Access | TalisU™",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale Partner Access | TalisU™",
    description: "Access dedicated TalisU™ MapSites™ using Fast Codes.",
    images: ["/seo/partner-access-og.png"],
  },
};

export default function PartnerAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
