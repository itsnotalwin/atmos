/**
 * Normalized domain types. The UI only consumes these; raw provider responses
 * never leave the service layer. Every value that a provider may omit is
 * nullable, so the UI can say "unavailable" instead of inventing a number.
 *
 * Canonical units are metric (°C, km/h, mm). Conversion to user preferences
 * happens in utils/units.ts at render time.
 *
 * Times are kept as the provider's local wall-clock strings ("YYYY-MM-DDTHH:MM")
 * in the location's timezone. They are compared as strings and formatted with
 * timezone-free arithmetic, so no UTC round-trip can shift a day.
 */

export type ConditionKind =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing-rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export interface Condition {
  kind: ConditionKind;
  code: number | null;
  label: string;
}

export interface Place {
  id: string;
  name: string;
  region: string | null;
  country: string;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  /** True only for the labeled fallback city, never for a detected location. */
  isFallback?: boolean;
}

export interface CurrentWeather {
  observedAt: string;
  temperatureC: number;
  feelsLikeC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  windDirectionDegrees: number | null;
  precipitationMm: number | null;
  cloudCoverPercent: number | null;
  condition: Condition;
  isDay: boolean;
}

export interface HourlyPoint {
  time: string;
  temperatureC: number | null;
  feelsLikeC: number | null;
  precipitationProbabilityPercent: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  uvIndex: number | null;
  condition: Condition;
  isDay: boolean;
}

export interface DailyPoint {
  /** "YYYY-MM-DD" in the location's timezone. */
  date: string;
  maxC: number | null;
  minC: number | null;
  condition: Condition;
  sunrise: string | null;
  sunset: string | null;
  precipitationSumMm: number | null;
  precipitationProbabilityMaxPercent: number | null;
  uvIndexMax: number | null;
}

export interface Forecast {
  place: Place;
  /** ISO timestamp (UTC) of when this snapshot was fetched from the provider. */
  fetchedAt: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}
