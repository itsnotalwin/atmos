import type { Condition, ConditionKind } from '../../types/weather';

/**
 * Central WMO weather-code mapping (as used by Open-Meteo).
 * Any unknown or missing code maps to kind "unknown" rather than a guess.
 */
const WMO: Record<number, { kind: ConditionKind; label: string }> = {
  0: { kind: 'clear', label: 'Clear' },
  1: { kind: 'clear', label: 'Mostly clear' },
  2: { kind: 'partly-cloudy', label: 'Partly cloudy' },
  3: { kind: 'overcast', label: 'Overcast' },
  45: { kind: 'fog', label: 'Fog' },
  48: { kind: 'fog', label: 'Freezing fog' },
  51: { kind: 'drizzle', label: 'Light drizzle' },
  53: { kind: 'drizzle', label: 'Drizzle' },
  55: { kind: 'drizzle', label: 'Heavy drizzle' },
  56: { kind: 'freezing-rain', label: 'Light freezing drizzle' },
  57: { kind: 'freezing-rain', label: 'Freezing drizzle' },
  61: { kind: 'rain', label: 'Light rain' },
  63: { kind: 'rain', label: 'Rain' },
  65: { kind: 'rain', label: 'Heavy rain' },
  66: { kind: 'freezing-rain', label: 'Light freezing rain' },
  67: { kind: 'freezing-rain', label: 'Freezing rain' },
  71: { kind: 'snow', label: 'Light snow' },
  73: { kind: 'snow', label: 'Snow' },
  75: { kind: 'snow', label: 'Heavy snow' },
  77: { kind: 'snow', label: 'Snow grains' },
  80: { kind: 'rain', label: 'Light showers' },
  81: { kind: 'rain', label: 'Showers' },
  82: { kind: 'rain', label: 'Violent showers' },
  85: { kind: 'snow', label: 'Snow showers' },
  86: { kind: 'snow', label: 'Heavy snow showers' },
  95: { kind: 'thunderstorm', label: 'Thunderstorm' },
  96: { kind: 'thunderstorm', label: 'Thunderstorm with hail' },
  99: { kind: 'thunderstorm', label: 'Thunderstorm with heavy hail' },
};

export function describeWeatherCode(code: number | null | undefined): Condition {
  if (code === null || code === undefined || !Number.isInteger(code) || !(code in WMO)) {
    return { kind: 'unknown', code: code ?? null, label: 'Conditions unavailable' };
  }
  const entry = WMO[code]!;
  return { kind: entry.kind, code, label: entry.label };
}

/** Kinds that the artwork system supports. Used to assert coverage in tests. */
export const ARTWORK_KINDS: readonly ConditionKind[] = [
  'clear',
  'partly-cloudy',
  'overcast',
  'fog',
  'drizzle',
  'rain',
  'freezing-rain',
  'snow',
  'thunderstorm',
  'unknown',
];
