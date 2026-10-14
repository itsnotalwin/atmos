# Project status

Last updated with the first full build of ATMOS.

## Complete and tested

- **Today.** Live current conditions for the active place. Oversized serif temperature, rules-based narrative, feels-like, high and low, six-metric conditions strip, daylight line with sunrise, sunset, and length, and an artwork panel that changes with condition and day or night.
- **Next 24 hours.** Custom SVG temperature line, rain-probability bars, "Now" marker, keyboard and touch navigation, a detail readout for the selected hour, and a table alternative.
- **Seven days.** Editorial rows with weekday, date, condition, rain chance, high and low, and a shared range bar. Each row opens a day detail page.
- **Day detail.** Metrics, sunrise, sunset, daylight length, factual observations derived from that day's values, artwork, and its hourly chart. Browser back returns to the list.
- **Places.** City search against the Open-Meteo geocoding API with debounce, loading and empty and error states, and region and country on every result. Add, show, make primary, and remove. Up to six places. "Use my location" requested only on button press, with specific messages for denied, unavailable, timeout, and unsupported.
- **Settings.** Celsius or Fahrenheit, km/h or mph, mm or inches, 12 or 24 hour time, light, dark, or system appearance. Dark is a separate palette. About, version, attribution, privacy statement, install guidance (Chromium button, iOS instructions), and clear local data with confirmation.
- **Offline and cache.** Forecast snapshots per place, labeled as cached, expired after 7 days, and never shown for another place. Honest offline empty state. Retry action.
- **PWA.** Manifest, 192 and 512 px icons, maskable icon, apple-touch icon, service worker with precache, runtime caching for both APIs, prompt-based update banner.
- **Quality.** Strict TypeScript, 34 automated tests passing, production build passing, axe-core clean on the audited pages, error boundary around the app shell.

## Partial

- **Artwork.** Nine condition compositions exist: clear day and night, partly cloudy, overcast, fog, drizzle, rain, freezing rain, thunderstorm, snow, and an unknown state. Night variants exist only for clear. The wind composition with curved linework is not built.
- **Wind.** Speed, direction in degrees and compass letters, and gusts are not shown. The brief's custom compass graphic is not built. Gust data is not requested.
- **Precipitation.** Hourly rain probability and amount are shown. A daily precipitation totals chart is not built.
- **Install.** The Install button appears when the browser offers it. The click and the resulting installed state were not tested.
- **Keyboard search.** Results are buttons reachable by Tab. The full combobox arrow-key pattern from the brief is not implemented.
- **Geolocated places** are named "Current location" with coordinates, because reverse geocoding is not implemented.
- **Mobile artwork placement.** On mobile the artwork sits below the hero text, so it is not visible in the first screen. The brief asks for a large artwork region near the top on mobile.

## Not built

- Air quality (P2 in the brief). No AQI or PM2.5 is requested or shown.
- Feels-like explainer view (10.6).
- Wind compass and wind artwork (10.2 and 5.2).
- Playwright end-to-end suite and responsive screenshots at all five required sizes.
- Lighthouse measurements and a full contrast audit.
- Light and dark icon variants. The current icon is a single set.
- Brand wordmark exploration beyond a letter-spaced "ATMOS" with the half-sun mark.
- Refresh behavior when returning to the app after a long time away, beyond the 10-minute refetch while open.

## Known issues

- **Offline browser behavior is unverified.** The test browser's network emulation did not reliably cut requests. Offline is covered by integration tests with mocked `fetch`.
- **Locations first-run flow.** A user who has never saved a place sees the default Johannesburg forecast. The brief asks that the default be clearly labeled; it is labeled "Default city, not your detected location" on Today.
- **Dark mode.** Adjusted once after review because the artwork lost contrast. It has not been re-reviewed on every screen.
- **Stale service worker in the browser.** After a new build, the browser may show the previous version until the update banner is accepted. This is intended, but it can confuse testers.

## Licensing and deployment

- Data is from Open-Meteo, CC BY 4.0. The free API is non-commercial with usage limits. Confirm before a commercial deployment, or switch to a licensed plan.
- Nothing is deployed. Deployment and any merge to a production branch require approval.

## Recommended next steps

1. Write the Playwright suite for the sixteen journeys in the brief, and run it against `npm run preview`.
2. Build the mobile hero so artwork sits above the fold, then review each responsive size with screenshots.
3. Add the wind composition and the compass graphic.
4. Run Lighthouse on the production build, and a contrast pass over every token pair.
5. Test install and update flows on Chromium desktop and Android before any release.
