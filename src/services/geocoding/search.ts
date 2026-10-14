import type { Place } from '../../types/weather';
import { WeatherServiceError } from '../weather/openMeteo';

/**
 * Open-Meteo geocoding. Returns real places with region and timezone, so
 * cities with the same name can be told apart.
 * Docs: https://open-meteo.com/en/docs/geocoding-api
 */

export const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

interface RawResult {
  id?: unknown;
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  country?: unknown;
  country_code?: unknown;
  admin1?: unknown;
  timezone?: unknown;
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function normalizePlaces(raw: unknown): Place[] {
  if (typeof raw !== 'object' || raw === null) {
    throw new WeatherServiceError('Search response was not an object', 'invalid');
  }
  const results = (raw as { results?: unknown }).results;
  // The API omits "results" entirely when nothing matches.
  if (results === undefined) return [];
  if (!Array.isArray(results)) throw new WeatherServiceError('Search results were malformed', 'invalid');

  const out: Place[] = [];
  for (const item of results as RawResult[]) {
    if (typeof item !== 'object' || item === null) continue;
    if (typeof item.name !== 'string' || !isNum(item.latitude) || !isNum(item.longitude)) continue;
    if (typeof item.timezone !== 'string') continue;
    out.push({
      id: `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
      name: item.name,
      region: typeof item.admin1 === 'string' ? item.admin1 : null,
      country: typeof item.country === 'string' ? item.country : 'Unknown country',
      countryCode: typeof item.country_code === 'string' ? item.country_code : null,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    });
  }
  return out;
}

export function buildSearchUrl(query: string, count = 6): string {
  const params = new URLSearchParams({ name: query.trim(), count: String(count), language: 'en', format: 'json' });
  return `${GEOCODING_ENDPOINT}?${params.toString()}`;
}

export async function searchPlaces(
  query: string,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  let res: Response;
  try {
    res = await fetchImpl(buildSearchUrl(query), { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new WeatherServiceError('Search was cancelled', 'aborted');
    }
    throw new WeatherServiceError('Could not reach the place search', 'network');
  }
  if (!res.ok) throw new WeatherServiceError(`Place search responded with ${res.status}`, 'http', res.status);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new WeatherServiceError('Place search returned unreadable data', 'invalid');
  }
  return normalizePlaces(body);
}
