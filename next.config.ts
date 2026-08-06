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
      // Per-image optimize uploads (one phone photo at a time) — not a giant multi-file POST.
      bodySizeLimit: "25mb",
    },
    // Allows a single high-res camera JPEG into /upload-image before server-side optimize.
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
