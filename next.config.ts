import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/client/:path*",
        destination: "/talispros/client/:path*",
        permanent: true,
      },
      {
        source: "/marketing/:path*",
        destination: "/talispros/marketing/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      // Self-service ebook uploads (images + PDF page rasters) can exceed 4mb.
      bodySizeLimit: "25mb",
    },
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
