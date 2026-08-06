# Talismaps™ Provider & Satellite Imagery Report

**Date:** 2026-07-15  
**Scope:** MapProvider abstraction, basemap views, production recommendation

---

## Executive summary

OpenStreetMap **does not** publish free satellite imagery tiles. Unrestricted commercial satellite basemaps are **not** available without a licensed cloud provider (Mapbox, Google Maps, or Esri ArcGIS Location Platform).

**Decision implemented in code:**

| Setting | Production default |
|---------|-------------------|
| Default Provider | **OpenStreetMap (Leaflet)** — `leaflet-osm` |
| Default View | **Street** — not Satellite |

Satellite is exposed as a selectable basemap view through the Leaflet adapter (Esri World Imagery tiles) and as a future capability on Mapbox / Google / Esri providers. It is **not** the platform default because commercial licensing requires accounts and paid usage beyond free tiers.

---

## 1. Which providers support Satellite?

| Provider | Street | Satellite | Hybrid | Terrain | Status in Talismaps™ |
|----------|--------|-----------|--------|---------|----------------------|
| **OpenStreetMap (Leaflet)** | Yes (OSM tiles) | Via optional Esri World Imagery layer in Leaflet adapter | Future | Future | **Implemented (default)** |
| **Mapbox** | Yes | Yes (`mapbox/satellite-*`) | Yes | Yes | Stub — needs `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| **Google Maps** | Yes | Yes | Yes | Yes | Stub — needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| **ESRI World Imagery** | Via ArcGIS streets | Yes (native) | Yes | Yes | Stub — needs `NEXT_PUBLIC_ESRI_API_KEY` for production |

### Free satellite investigation (OpenStreetMap ecosystem)

| Source | Satellite? | Free for commercial product use? | Notes |
|--------|------------|----------------------------------|-------|
| osm.org raster tiles | No | Street only (fair-use; self-host or paid tile host at scale) | Default Leaflet street layer |
| Esri World Imagery in OSM **editors** | Yes | **No** for general apps | Explicitly limited to OSM editing workflows |
| Esri ArcGIS Location Platform basemaps | Yes | Free tier then paid | Requires API key / account |
| Mapbox Satellite | Yes | Free tier then paid | API token required |
| Google Maps Satellite | Yes | Billing account required | Maps JavaScript API |

**Conclusion:** Free, unrestricted satellite for a commercial Mapsite™ product is **not** available. Therefore default view remains **Street**.

---

## 2. Licensing considerations

### OpenStreetMap (street)
- Data: ODbL — attribution required (“© OpenStreetMap contributors”).
- Tile usage: osm.org public tiles are for light use; production at scale should use a commercial tile host or self-hosted tiles.
- Suitable as Talismaps™ default engine with no API key.

### Esri World Imagery
- **OSM editor exception:** free for tracing/editing OSM; not a general commercial tile grant.
- **Product apps:** use ArcGIS Location Platform (or ArcGIS Online) with API key / OAuth; attribution to Esri and imagery providers required.
- Unauthenticated legacy `arcgisonline.com` tile URLs are **not** a production licensing strategy for revenue-generating apps.

### Mapbox
- Commercial Terms of Service; Maps SDK / GL styles require an access token.
- Attribution per Mapbox requirements.

### Google Maps
- Google Maps Platform Terms; billing account mandatory for production.
- Attribution and logo requirements apply.

---

## 3. API costs (approximate, mid-2026 public list pricing)

| Provider | Free allowance (typical) | Overages (illustrative) |
|----------|--------------------------|-------------------------|
| **OSM public tiles** | Soft fair-use | Move to paid tile CDN or self-host before heavy traffic |
| **Esri ArcGIS Location Platform** | ~2M basemap tiles / month free | ~$0.15 / 1,000 tiles after free tier; session model also available |
| **Mapbox** | Free tier on Mapbox account | Usage-based beyond free MAU/tile quotas |
| **Google Maps** | Limited monthly credit on some accounts | $7 / 1,000 map loads (Dynamic Maps) class pricing — confirm in Google Cloud billing |

Exact figures change; treat this table as directional and verify before contracting.

---

## 4. Architecture (implemented)

Provider-agnostic contract remains `MapProvider`:

- **Providers registered:** `leaflet-osm`, `mapbox`, `google-maps`, `esri`
- **Basemap views:** `street` | `satellite` | `hybrid` | `terrain`  
  - Hybrid / Terrain marked **future** in settings UI
- Consumers request a **view**, never a tile URL
- Leaflet resolves views via internal basemap descriptors (`providers/basemap-layers.ts`)
- Global defaults persist in `talismaps_platform_settings` (singleton `global` row)
- Settings UI: `/talismaps/settings` and `/talismaps/dashboard/settings`
- Map surfaces read defaults via `/api/talismaps/settings`

---

## 5. Production recommendation

1. **Ship with OpenStreetMap + Street view as defaults** — zero API key, full MapProvider abstraction, production-ready pins/drag.
2. **Do not default to Satellite** until an Esri / Mapbox / Google key is provisioned and usage budget approved.
3. **Enable Satellite selectively** in Settings for demos; for production satellite:
   - Prefer **Mapbox** or **Esri ArcGIS Location Platform** with authenticated keys, or
   - **Google Maps** if the org already has Maps Platform billing.
4. **At scale for OSM street tiles**, migrate tile hosting away from `tile.openstreetmap.org` to a compliant provider (MapTiler, Stadia, self-hosted, etc.) without changing consumer code — only the Leaflet basemap descriptor.

---

## 6. Apply database migration

```bash
npx supabase db push --include-all
```

Migration: `072_talismaps_platform_settings.sql`

Until applied, settings reads fall back to env/registry defaults (`leaflet-osm` + `street`).
