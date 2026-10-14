# Testing

## Commands

| Command | Purpose |
|---|---|
| `npm run typecheck` | `tsc --noEmit` with strict mode |
| `npm test` | Vitest, all automated tests |
| `npm run build` | Type check plus production build, including the service worker |
| `npm run preview` | Serves the production build on port 4173 |

## Automated results

Last run (this build):

| File | Tests | Result |
|---|---|---|
| `tests/units-and-time.test.ts` | 13 | Pass |
| `tests/weather-pipeline.test.ts` | 16 | Pass |
| `tests/offline.integration.test.tsx` | 5 | Pass |
| **Total** | **34** | **All pass** |

Type check: pass. Production build: pass.

### What the unit tests cover

- Temperature, wind, precipitation, and UV conversion and formatting. Includes `-0` handling and missing values.
- WMO weather code mapping, including unknown and non-integer codes.
- Timezone-safe date and time formatting: weekday stability across midnight, 12 and 24 hour output, hour keys, durations, daylight progress.
- Open-Meteo normalization: mapping, `null` for missing values, rejection of responses without `current`, request URL parameters.
- Error classification: network, HTTP, unreadable body.
- Geocoding normalization, including a missing `results` key and disambiguation by region.
- Narrative engine: sentences derive from data; rain is mentioned only at 60% or more; unknown conditions say so.
- Local persistence: round trip, corrupt JSON, invalid preference values, six-place cap, snapshot expiry.

### What the integration tests cover

Real hooks, real storage, mocked `fetch`:

- Live forecast renders and is written to the snapshot store.
- A failed live request with a snapshot shows the cached label and a refresh-failed note.
- A failed request with no snapshot shows an honest error and no values.
- Offline launch with no snapshot shows the offline empty state.
- A snapshot for another place is never shown.

## Manual browser verification (production build, Chromium)

Performed against the live Open-Meteo API.

| Check | Result |
|---|---|
| Today loads live data for the default city | Pass. Temperature matched the API response |
| Search "Lisbon" returns real results with regions | Pass. Six results, including Lisbon District, Portugal |
| Add a place, Today switches to it | Pass. Lisbon, live, time shown in Lisbon's timezone |
| Fahrenheit and 12-hour settings apply | Pass. 30°C shows as 86°F |
| Theme and unit settings persist after reload | Pass |
| Seven-day list and day detail | Pass. Seven rows; day detail shows 24 hourly values |
| Browser back from day detail | Pass |
| Mobile 390 px: no horizontal page overflow | Pass. Hourly row scrolls inside its own container |
| Bottom navigation on mobile | Pass |
| axe-core on Today, Forecast, Settings | Pass. Zero violations |
| axe-core on Locations | Found one critical issue (invalid `aria-controls`). Fixed. Re-run: zero violations |
| Offline in the browser | Not verified. Emulated offline was inconsistent in the test browser, so offline behavior is covered by integration tests only |
| Geolocation prompt | Not tested. Requires a granted permission in the browser |
| Install button click | Not tested |
| Update banner | Not tested end to end |

## Not yet in place

- **Playwright end-to-end suite.** The brief asks for Playwright specs covering the 16 listed journeys. They are not written yet. The manual checks above cover the same ground but are not automated.
- **Responsive screenshot set at all five required viewports.** Captured: mobile 390×844, desktop 1440×900. Not captured: 375×812, 768×1024, 1920×1080, or a very narrow viewport.
- **Lighthouse.** Not run. No performance or SEO score is claimed.
- **Contrast audit** of every colour pair, and screen reader testing with a real assistive technology.

## Screenshots

Files in `screenshots/` are captured from the running production build:

- `mobile-today-390x844.png`
- `desktop-today-1440x900.png`
- `mobile-forecast-390x844.png`
- `desktop-locations-1440x900.png`
- `desktop-settings-1440x900.png`

Missing from the set: the hourly detail state, day detail, the offline state, and the installed standalone view.
