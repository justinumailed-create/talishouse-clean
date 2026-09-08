export const dynamic = "force-dynamic";

/**
 * Satellite still of a Mapsite™ pin for Jarlberg template page 1.
 * Fetched server-side so the compositor is not blocked by tile CORS.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return new Response("lat and lng are required.", { status: 400 });
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return new Response("Coordinates are out of range.", { status: 400 });
  }

  const span = 0.016;
  const bbox = `${lng - span},${lat - span * 0.56},${lng + span},${lat + span * 0.56}`;
  const esri = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${encodeURIComponent(
    bbox,
  )}&bboxSR=4326&imageSR=4326&size=1920,1080&format=jpg&f=image`;

  const upstream = await fetch(esri, {
    cache: "no-store",
    headers: { Accept: "image/jpeg,image/*" },
  });
  if (!upstream.ok) {
    return new Response("Map background is unavailable.", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
