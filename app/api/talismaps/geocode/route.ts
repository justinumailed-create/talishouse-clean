import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

type NominatimReverseResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  error?: string;
};

async function forwardGeocode(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    {
      headers: {
        "User-Agent": "TalisMaps/Talispros (talishouse-clean)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    return NextResponse.json({ found: false });
  }

  const results = (await response.json()) as NominatimSearchResult[];
  const match = results[0];
  if (!match) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    latitude: match.lat,
    longitude: match.lon,
    address: match.display_name ?? null,
  });
}

async function reverseGeocode(lat: string, lon: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=0`,
    {
      headers: {
        "User-Agent": "TalisMaps/Talispros (talishouse-clean)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    return NextResponse.json({ found: false });
  }

  const result = (await response.json()) as NominatimReverseResult;
  if (result.error || !result.display_name) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    latitude: result.lat ?? lat,
    longitude: result.lon ?? lon,
    address: result.display_name,
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();
  const lat = params.get("lat")?.trim();
  const lon = params.get("lon")?.trim() ?? params.get("lng")?.trim();

  try {
    if (lat && lon) {
      const parsedLat = Number.parseFloat(lat);
      const parsedLon = Number.parseFloat(lon);
      if (
        !Number.isFinite(parsedLat) ||
        !Number.isFinite(parsedLon) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLon < -180 ||
        parsedLon > 180
      ) {
        return NextResponse.json(
          { error: "Invalid lat/lon coordinates" },
          { status: 400 }
        );
      }
      return await reverseGeocode(lat, lon);
    }

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter q or lat/lon" },
        { status: 400 }
      );
    }

    return await forwardGeocode(query);
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}
