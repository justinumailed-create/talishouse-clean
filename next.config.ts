import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/talispros/start",
        destination: "/",
        permanent: false,
      },
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
      // Server Actions only — does not apply to /api route handlers, and does
      // not raise Vercel's 4.5 MB Function payload cap (HTTP 413).
      bodySizeLimit: "25mb",
    },
    // Next.js proxy buffer for self-hosted / large Server Actions. Phone photos
    // still must be client-shrunk before POST /upload-image on Vercel.
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
