# Architecture

## Stack

| Area | Choice | Why |
|---|---|---|
| UI | React 19, TypeScript (strict) | Required by the brief; strict mode catches null handling early |
| Build | Vite | Fast builds, first-class PWA plugin |
| Routing | React Router | Browser history for every screen and detail view |
| Server state | TanStack Query | Request cancellation via `AbortSignal`, refetch on reconnect, dedupe |
| Client state | React context with `useState` | Small state surface (places, preferences); no store library needed |
| PWA | vite-plugin-pwa with Workbox | Proven precache and runtime caching; avoids a hand-written service worker |
| Charts | Custom SVG | Editorial look; no chart library defaults |
| Fonts | Self-hosted Fontsource (Latin subsets) | Works offline, no third-party font requests |
| Tests | Vitest, Testing Library, jsdom | Fast, same toolchain as Vite |

Deliberately not used: Tailwind (the design system is small and token-driven CSS is simpler to audit), Motion (CSS transitions are enough for the current motion set), Zustand (context is sufficient), any backend.

## Layers

```
src/
  types/weather.ts          Domain model. The only shape the UI reads.
  services/
    weather/codes.ts        WMO code to Condition mapping (single source of truth)
    weather/openMeteo.ts    Forecast adapter: URL, fetch, validation, normalization
    geocoding/search.ts     Place search adapter
    geolocation.ts          Browser geolocation, requested only on user action
  storage/local.ts          Versioned localStorage keys, defensive reads, snapshots
  state/AppState.tsx        Saved places, active place, preferences
  hooks/                    useForecast (live + cached), debounce, online, install
  utils/                    Units, time (timezone-safe), narrative
  components/
    artwork/                Signature weather artwork (SVG, condition-driven)
    charts/                 Hourly chart with keyboard and table alternative
    weather/                Shared gate (loading, offline, error) and status line
    layout/                 Shell, navigation, PWA update banner
    ui/                     Skeletons, notices, error boundary
  pages/                    Today, Forecast, DayDetail, Locations, Settings
  app/App.tsx               Providers, routes
```

Rule: pages consume normalized `Forecast` objects. Raw API shapes never leave `services/`.

## Routes

| Path | Screen |
|---|---|
| `/` | Today |
| `/forecast` | Seven-day overview |
| `/forecast/:date` | Day detail (`YYYY-MM-DD`, place-local) |
| `/locations` | Search, geolocation, saved places |
| `/settings` | Units, appearance, install, about, local data |

## Data model decisions

- **Canonical units are metric.** The adapter requests `°C`, `km/h`, and `mm`. Conversion to the user's preference happens at render time (`utils/units.ts`). Changing a unit never refetches.
- **Missing values are `null`.** A missing number renders as an en dash, not zero. A response without `current` is rejected as invalid.
- **Times are provider-local wall-clock strings.** The forecast is requested with `timezone=auto`, so each place's times come back in that place's zone. The app compares and formats these strings directly and does not round-trip through UTC. This keeps a date from shifting when viewing a city in another timezone. Tests cover this in `tests/units-and-time.test.ts`.
- **`fetchedAt` is UTC.** It records when the device received the forecast. It is displayed in the place's timezone.
- **Narrative is rules-based.** Each sentence comes from a field that exists. Rain is mentioned only when the forecast's own probability is at least 60% in the next 12 hours.

## Weather state flow

`useForecast(place)`:

1. A TanStack Query keyed by `['forecast', place.id, lat, lon]` fetches live data. Timeout and retry are bounded.
2. On success the normalized forecast is written to a snapshot keyed by place id.
3. The hook returns `live` when the query has data for this place, otherwise a `cached` snapshot for this place only, otherwise `none`.
4. Snapshots are matched by place id and expire after 7 days.

`ForecastGate` renders the child view only when a forecast for the active place exists. Otherwise it renders one of: a skeleton while loading, an honest offline empty state, or an error with a retry action. This is why a city switch can never show the previous city's values under the new name.

## Storage

| Key | Contents |
|---|---|
| `atmos.places.v1` | Saved places (max 6), active id |
| `atmos.prefs.v1` | Units, theme |
| `atmos.snapshots.v1` | Last successful forecast per place (max 12, 7-day expiry) |

Reads validate shape and fall back to defaults on corrupt JSON. Writes that fail (quota, disabled storage) are ignored, and the app keeps working in memory.

## Artwork system

`components/artwork/WeatherArt.tsx` maps a `ConditionKind` and day or night flag to a composition. Each composition uses the same vocabulary: disks, horizon rules, diagonal hatch, halftone dots, and falling marks for rain, snow, and drizzle. Motion is CSS only, and `prefers-reduced-motion` disables it. Adding a condition means adding one `case` and one entry in the design system doc.

## Accessibility decisions

- The hourly chart is decorative SVG. Every hour is a real button with its own label, so no value depends on hover. Arrow keys, Home, and End move between hours, and a table alternative is included.
- Unavailable values are announced as text ("–", "Unavailable"), never hidden.
- Artwork is `aria-hidden`.
- Error boundary prevents one failed view from blanking the app.

## Known architectural limits

- Only one place's forecast is fetched at a time (the active place). Saved places are not prefetched. This keeps requests low and the free API within limits.
- Geolocated places are named "Current location" with coordinates. Reverse geocoding is not implemented, so the name is not a locality.
- Refetch interval is 10 minutes while the page is open.
