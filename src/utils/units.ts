export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph';
export type PrecipUnit = 'mm' | 'in';
export type TimeFormat = '12h' | '24h';
export type ThemePref = 'light' | 'dark' | 'system';

export interface UnitPrefs {
  temp: TempUnit;
  wind: WindUnit;
  precip: PrecipUnit;
  time: TimeFormat;
}

export const DEFAULT_UNITS: UnitPrefs = { temp: 'c', wind: 'kmh', precip: 'mm', time: '24h' };

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

/** Rounds to a whole number for display. Avoids "-0". */
function round0(n: number): number {
  const r = Math.round(n);
  return Object.is(r, -0) ? 0 : r;
}

export function formatTemp(celsius: number | null, unit: TempUnit): string {
  if (celsius === null || !Number.isFinite(celsius)) return '–';
  const value = unit === 'f' ? celsiusToFahrenheit(celsius) : celsius;
  return `${round0(value)}°`;
}

export function formatWind(kmh: number | null, unit: WindUnit): string {
  if (kmh === null || !Number.isFinite(kmh)) return '–';
  const value = unit === 'mph' ? kmhToMph(kmh) : kmh;
  return `${round0(value)} ${unit === 'mph' ? 'mph' : 'km/h'}`;
}

export function formatPrecip(mm: number | null, unit: PrecipUnit): string {
  if (mm === null || !Number.isFinite(mm)) return '–';
  if (unit === 'in') {
    const inches = mmToInches(mm);
    return `${inches.toFixed(2)} in`;
  }
  const rounded = mm >= 10 ? round0(mm) : Math.round(mm * 10) / 10;
  return `${rounded} mm`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '–';
  return `${round0(value)}%`;
}

export function formatUv(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '–';
  return String(Math.round(value * 10) / 10);
}

/** Descriptive UV category (WHO scale). */
export function uvCategory(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable';
  if (value < 3) return 'Low';
  if (value < 6) return 'Moderate';
  if (value < 8) return 'High';
  if (value < 11) return 'Very high';
  return 'Extreme';
}
