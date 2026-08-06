import { ImageResponse } from "next/og";

/** Node runtime — @vercel/og/Satori exceeds the 1 MB Edge bundle limit on Hobby. */
export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#171717" />
            <path d="M20 44V28L32 20L44 28V44H36V34H28V44H20Z" fill="white" />
          </svg>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#171717",
              letterSpacing: "-0.02em",
            }}
          >
            Talispros™
          </div>
        </div>
        <div
          style={{
            fontSize: "26px",
            color: "#525252",
            textAlign: "center",
            marginBottom: "40px",
            lineHeight: 1.4,
          }}
        >
          Industry Adjacent Market Places
          <br />
          for Real Estate Professionals
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "18px",
            color: "#a3a3a3",
            letterSpacing: "0.02em",
          }}
        >
          <span>Mapsites™</span>
          <span>•</span>
          <span>FAST Codes™</span>
          <span>•</span>
          <span>TalisForms™</span>
          <span>•</span>
          <span>Talismaps™</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
