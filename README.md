# ATMOS

Weather without the noise. A weather forecast laid out like a daily publication.

ATMOS is a responsive React and TypeScript weather app and installable PWA. It uses live data from [Open-Meteo](https://open-meteo.com/), stores forecasts for offline reading, and labels anything that is not live.

## Status

Early build. Core flows work and are tested. See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for what is complete, partial, and not yet built.

## Requirements

- Node 20 or newer (developed on Node 26)
- npm

## Install and run

```bash
npm install
npm run dev          # development server on http://localhost:5173
```

## Build and preview

```bash
npm run build        # type check, then production build with service worker
npm run preview      # serves dist/ on http://localhost:4173
```

The PWA service worker is generated only in the production build. Test installation, offline behavior, and updates against `npm run preview`, not `npm run dev`.

## Tests

```bash
npm test             # unit and integration tests (Vitest)
npm run typecheck    # TypeScript strict mode
```

See [docs/TESTING.md](docs/TESTING.md).

## Regenerate icons

```bash
node scripts/make-icons.mjs
```

Icons are generated from the same geometry as the in-app mark, with no external dependencies.

## Using the app

- **Today** shows the active place: temperature, a rules-based narrative, current conditions, daylight, and the next 24 hours.
- **Forecast** lists seven days. Select a day for its detail page.
- **Places** searches cities through the geocoding API, adds up to six saved places, and offers "Use my location". Location is requested only after you press that button.
- **Settings** sets units (°C or °F, km/h or mph, mm or in, 12 or 24 hour time), appearance (light, dark, system), install guidance, attribution, and clearing local data.

Until you save a place, ATMOS shows Johannesburg, labeled as the default city and not as your location.

## Install as an app

- **Chromium (Chrome, Edge, Android):** an Install button appears in the header when the browser offers it. You can also use the browser menu.
- **iOS Safari:** Share, then Add to Home Screen. Settings shows this guidance.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, data flow, and decisions
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): tokens, type, layout, artwork language
- [docs/PWA.md](docs/PWA.md): installation, caching, offline, updates
- [docs/TESTING.md](docs/TESTING.md): commands, coverage, and manual verification
- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md): status, limitations, next work

## Data and licensing

Forecasts, geocoding, and the attribution are from Open-Meteo, licensed CC BY 4.0. The free Open-Meteo API is for non-commercial use with usage limits. Confirm the terms before any commercial launch, or switch to a licensed plan.

ATMOS stores saved places, preferences, and the latest forecast for each place in this browser's localStorage. There is no account, no analytics, and no tracking.
