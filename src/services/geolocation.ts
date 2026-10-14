import type { Place } from '../types/weather';

/**
 * Geolocation is requested only from an explicit user action (the caller
 * invokes this from a click handler). Failures map to user-facing reasons.
 */
export type GeoFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export function requestCurrentPlace(): Promise<{ place: Place } | { failure: GeoFailure }> {
  if (!('geolocation' in navigator)) return Promise.resolve({ failure: 'unsupported' });
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        resolve({
          place: {
            id: `geo:${lat},${lon}`,
            name: 'Current location',
            region: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
            country: '',
            countryCode: null,
            latitude: lat,
            longitude: lon,
            // Replaced by the provider's resolved timezone on the first forecast.
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        });
      },
      (err) => {
        // GeolocationPositionError codes: 1 denied, 2 unavailable, 3 timeout.
        if (err.code === 1) resolve({ failure: 'denied' });
        else if (err.code === 3) resolve({ failure: 'timeout' });
        else resolve({ failure: 'unavailable' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
