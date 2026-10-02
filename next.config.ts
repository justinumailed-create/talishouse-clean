import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/assets/Centrefolds.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="Centrefolds.pdf"',
          },
        ],
      },
      {
        source: "/talispros/demo-mapsite/Centrefolds.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="Centrefolds.pdf"',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/talisu/eb",
        destination: "/catalogue/bookshelf",
        permanent: true,
      },
      {
        source: "/talisu/eb/",
        destination: "/catalogue/bookshelf",
        permanent: true,
      },
      {
        source: "/talisu/catalogue",
        destination: "/catalogue",
        permanent: true,
      },
      {
        source: "/talisu/catalogue/",
        destination: "/catalogue",
        permanent: true,
      },
      {
        source: "/talisu/demo",
        destination: "/talispros/demo-mapsite",
        permanent: true,
      },
      {
        source: "/talisu/demo/",
        destination: "/talispros/demo-mapsite",
        permanent: true,
      },
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
    globalNotFound: true,
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
