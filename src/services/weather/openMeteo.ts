import type {
  CurrentWeather,
  DailyPoint,
  Forecast,
  HourlyPoint,
  Place,
} from '../../types/weather';
import { describeWeatherCode } from './codes';

/**
 * Open-Meteo forecast adapter. Converts the raw response into normalized
 * Forecast objects. Missing or malformed values become null; a response
 * that lacks the core "current" block is rejected rather than guessed at.
 *
 * Docs: https://open-meteo.com/en/docs
 */

export const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'http' | 'invalid' | 'aborted',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Reads element `i` of a parallel array, or null when absent. */
function at<T>(arr: unknown, i: number, pick: (v: unknown) => T | null): T | null {
  if (!Array.isArray(arr)) return null;
  return pick(arr[i]);
}

export function buildForecastUrl(place: Pick<Place, 'latitude' | 'longitude'>): string {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,is_day',
    hourly:
      'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    temperature_unit: 'celsius',
    timeformat: 'iso8601',
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

export function normalizeForecast(raw: unknown, place: Place, fetchedAt: string): Forecast {
  if (!isObject(raw)) throw new WeatherServiceError('Forecast response was not an object', 'invalid');
  const c = raw['current'];
  if (!isObject(c) || num(c['temperature_2m']) === null || str(c['time']) === null) {
    throw new WeatherServiceError('Forecast response is missing current conditions', 'invalid');
  }

  const current: CurrentWeather = {
    observedAt: str(c['time'])!,
    temperatureC: num(c['temperature_2m'])!,
    feelsLikeC: num(c['apparent_temperature']),
    humidityPercent: num(c['relative_humidity_2m']),
    windSpeedKmh: num(c['wind_speed_10m']),
    windDirectionDegrees: num(c['wind_direction_10m']),
    precipitationMm: num(c['precipitation']),
    cloudCoverPercent: num(c['cloud_cover']),
    condition: describeWeatherCode(num(c['weather_code'])),
    isDay: num(c['is_day']) === 1,
  };

  const h = isObject(raw['hourly']) ? raw['hourly'] : {};
  const hTimes = Array.isArray(h['time']) ? h['time'] : [];
  const hourly: HourlyPoint[] = [];
  hTimes.forEach((t, i) => {
    const time = str(t);
    if (!time) return;
    hourly.push({
      time,
      temperatureC: at(h['temperature_2m'], i, num),
      feelsLikeC: at(h['apparent_temperature'], i, num),
      precipitationProbabilityPercent: at(h['precipitation_probability'], i, num),
      precipitationMm: at(h['precipitation'], i, num),
      windSpeedKmh: at(h['wind_speed_10m'], i, num),
      uvIndex: at(h['uv_index'], i, num),
      condition: describeWeatherCode(at(h['weather_code'], i, num)),
      isDay: at(h['is_day'], i, num) === 1,
    });
  });

  const d = isObject(raw['daily']) ? raw['daily'] : {};
  const dDates = Array.isArray(d['time']) ? d['time'] : [];
  const daily: DailyPoint[] = [];
  dDates.forEach((t, i) => {
    const date = str(t);
    if (!date) return;
    daily.push({
      date,
      maxC: at(d['temperature_2m_max'], i, num),
      minC: at(d['temperature_2m_min'], i, num),
      condition: describeWeatherCode(at(d['weather_code'], i, num)),
      sunrise: at(d['sunrise'], i, str),
      sunset: at(d['sunset'], i, str),
      precipitationSumMm: at(d['precipitation_sum'], i, num),
      precipitationProbabilityMaxPercent: at(d['precipitation_probability_max'], i, num),
      uvIndexMax: at(d['uv_index_max'], i, num),
    });
  });

  // The provider resolves the timezone for the coordinates (timezone=auto).
  // This matters for geolocated places, which have no timezone of their own.
  const resolvedTz = str(raw['timezone']) ?? place.timezone;
  return { place: { ...place, timezone: resolvedTz }, fetchedAt, current, hourly, daily };
}

export interface FetchForecastOptions {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

export async function fetchForecast(
  place: Place,
  { signal, fetchImpl = fetch, now = () => new Date() }: FetchForecastOptions = {},
): Promise<Forecast> {
  let res: Response;
  try {
    res = await fetchImpl(buildForecastUrl(place), { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new WeatherServiceError('Request was cancelled', 'aborted');
    }
    throw new WeatherServiceError('Could not reach the weather service', 'network');
  }
  if (!res.ok) {
    throw new WeatherServiceError(`Weather service responded with ${res.status}`, 'http', res.status);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new WeatherServiceError('Weather service returned unreadable data', 'invalid');
  }
  return normalizeForecast(body, place, now().toISOString());
}
