# TalisMaps™ MapLibre Engine & Style Providers

TalisMaps™ renders all maps with **MapLibre GL JS**. Business logic never imports Google Maps or other proprietary map SDKs.

## Architecture

```
Surfaces (editor, embeds, registration, MapSites)
        ↓
MapEngineProvider / MapEngineCanvas
        ↓
MapProvider contract (provider-agnostic)
        ↓
MapLibreProvider  ← live default
        ↓
MapStyleManager → MapTiler style URLs
```

| Layer | Responsibility |
|-------|----------------|
| `MapProvider` / `MapInstance` | Pins, viewport, drag, clicks — no vendor types |
| `MapLibreProvider` | MapLibre GL JS mount + HTML markers |
| `MapStyleManager` | Maps style ids → MapTiler style JSON URLs |
| Tile vendor | **MapTiler only** |

## Default configuration

| Setting | Default |
|---------|---------|
| Engine | MapLibre GL JS (`maplibre`) |
| Style | **Satellite** |
| Tile vendor | MapTiler |
| API key | `YOUR_MAPTILER_API_KEY` (placeholder) |

## Environment variables

Add these to `.env.local` (and Vercel project settings):

```bash
# Rendering engine (optional — defaults to maplibre)
NEXT_PUBLIC_TALISMAPS_MAP_PROVIDER=maplibre

# MapTiler Cloud key — required for basemap tiles
NEXT_PUBLIC_MAPTILER_API_KEY=YOUR_MAPTILER_API_KEY

# Optional aliases
# NEXT_PUBLIC_TALISMAPS_MAPTILER_API_KEY=...
```

### Replace the MapTiler API key

1. Create a free account at [MapTiler Cloud](https://cloud.maptiler.com/).
2. Copy your API key from **Account → Keys**.
3. Set `NEXT_PUBLIC_MAPTILER_API_KEY` in `.env.local` and in Vercel → Project → Settings → Environment Variables.
4. Redeploy / restart `npm run dev`.

Until a real key is set, MapLibre requests use the literal placeholder string and satellite/street tiles will fail to load from MapTiler.

### Available styles (Style Manager)

| Style id | Label | MapTiler map id |
|----------|-------|-----------------|
| `satellite` | Satellite (default) | `hybrid` (satellite-v2 + labels) |
| `street` | Streets | `streets-v2` |
| `terrain` | Terrain | `outdoor-v2` |
| `light` | Light | `basic-v2` |
| `dark` | Dark | `basic-v2-dark` |

Switch styles at runtime via:

- Platform settings (`/talismaps/settings`)
- Editor style switcher (`MapStyleSwitcher`)
- `MapEngineProvider` prop `basemapView` / `setBasemapView()`

## Optional MapTiler style URL overrides

Override individual MapTiler style URLs without changing business logic:

```bash
NEXT_PUBLIC_TALISMAPS_STYLE_SATELLITE=https://api.maptiler.com/maps/.../style.json?key=...
NEXT_PUBLIC_TALISMAPS_STYLE_STREET=https://api.maptiler.com/maps/.../style.json?key=...
NEXT_PUBLIC_TALISMAPS_STYLE_TERRAIN=https://api.maptiler.com/maps/.../style.json?key=...
NEXT_PUBLIC_TALISMAPS_STYLE_LIGHT=https://api.maptiler.com/maps/.../style.json?key=...
NEXT_PUBLIC_TALISMAPS_STYLE_DARK=https://api.maptiler.com/maps/.../style.json?key=...
```

Overrides win over the default MapTiler catalog. Pins, clustering hooks, search, geolocation, and drawing tools continue to talk only to `MapProvider` / `MapInstance`.

### Add another MapProvider adapter

1. Implement `MapProvider` in `lib/talismaps/map-engine/providers/`.
2. Register it in `registry.ts`.
3. Prefer MapLibre-compatible MapTiler style JSON so the Style Manager can stay shared.

Do **not** add a Google Maps JavaScript SDK adapter.
Do **not** use OpenFreeMap or other non-MapTiler tile vendors.

## Database migration

Apply `073_talismaps_maplibre_styles.sql` so platform settings accept:

- Providers: `maplibre`, `mapbox`, `esri`
- Styles: `satellite`, `street`, `terrain`, `light`, `dark`

Legacy rows (`leaflet-osm`, `google-maps`, `hybrid`, `street`) normalize to `maplibre` + `satellite`.

```bash
npx supabase db push --include-all
```

## Build note

Production builds use Webpack (`next build --webpack`) because MapLibre’s package graph currently trips a Turbopack edge-chunk panic in this Next.js version. Dev (`next dev`) remains Turbopack by default.

- `lib/talismaps/map-engine/providers/maplibre-provider.ts` — MapLibre adapter
- `lib/talismaps/map-engine/styles/` — Style Manager + tile vendor config
- `lib/talismaps/map-engine/registry.ts` — provider registry
- `components/talismaps/map-engine/MapStyleSwitcher.tsx` — style UI
- `components/talismaps/map-engine/MapEngineCanvas.tsx` — React mount
