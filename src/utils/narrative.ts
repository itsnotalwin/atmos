import type { Forecast } from '../types/weather';
import { formatTemp, type TempUnit } from './units';
import { hourKey, parseWallClock } from './time';

/**
 * Rules-based weather narrative. Every sentence is derived from fields that
 * are actually present. When data is missing, the sentence is omitted rather
 * than filled with a guess. No claims beyond the forecast's own numbers.
 */

export function timeOfDayWord(wall: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const c = parseWallClock(wall);
  if (!c) return 'afternoon';
  if (c.hour >= 5 && c.hour < 12) return 'morning';
  if (c.hour >= 12 && c.hour < 17) return 'afternoon';
  if (c.hour >= 17 && c.hour < 21) return 'evening';
  return 'night';
}

/**
 * Builds a short headline for the Today hero from current conditions and the
 * remaining hours of the day. Returns one sentence.
 */
export function buildNarrative(forecast: Forecast, unit: TempUnit): string {
  const { current, hourly } = forecast;
  const part = timeOfDayWord(current.observedAt);
  const kind = current.condition.kind;

  const base: Record<string, string> = {
    clear: current.isDay ? `A clear ${part}.` : 'A clear night.',
    'partly-cloudy': `A partly cloudy ${part}.`,
    overcast: `A grey, overcast ${part}.`,
    fog: `Low cloud and fog this ${part}.`,
    drizzle: `Light drizzle this ${part}.`,
    rain: `Rain this ${part}.`,
    'freezing-rain': `Freezing rain this ${part}. Take care on surfaces.`,
    snow: `Snow this ${part}.`,
    thunderstorm: `Thunderstorms this ${part}.`,
    unknown: `Conditions for this ${part} are unavailable.`,
  };
  let line = base[kind] ?? base['unknown']!;

  // Look ahead over the next 12 hours for a notable change.
  const nowKey = hourKey(current.observedAt);
  const upcoming = hourly.filter((h) => h.time >= nowKey).slice(0, 12);
  const rainy = upcoming.find((h) => (h.precipitationProbabilityPercent ?? 0) >= 60);
  if (rainy && kind !== 'rain' && kind !== 'thunderstorm') {
    const when = parseWallClock(rainy.time);
    if (when) line += ` Rain is likely around ${String(when.hour).padStart(2, '0')}:00.`;
  }

  const temps = upcoming.map((h) => h.temperatureC).filter((t): t is number => t !== null);
  if (temps.length >= 3) {
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    if (max - min >= 6) {
      line += ` Temperatures range from ${formatTemp(min, unit)} to ${formatTemp(max, unit)} over the next hours.`;
    }
  }
  return line;
}
