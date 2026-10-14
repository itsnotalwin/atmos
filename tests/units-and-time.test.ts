import { describe, expect, it } from 'vitest';
import { describeWeatherCode, ARTWORK_KINDS } from '../src/services/weather/codes';
import {
  celsiusToFahrenheit,
  formatPrecip,
  formatTemp,
  formatWind,
  kmhToMph,
  mmToInches,
  uvCategory,
} from '../src/utils/units';
import {
  daylightProgress,
  formatClock,
  formatDuration,
  formatHourLabel,
  formatLongDate,
  formatWeekday,
  hourKey,
  minutesBetween,
  parseWallClock,
} from '../src/utils/time';

describe('unit conversion', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });

  it('converts km/h to mph and mm to inches', () => {
    expect(kmhToMph(100)).toBeCloseTo(62.1371, 3);
    expect(mmToInches(25.4)).toBeCloseTo(1, 6);
  });

  it('formats temperatures in the chosen unit and never shows -0', () => {
    expect(formatTemp(24.4, 'c')).toBe('24°');
    expect(formatTemp(0, 'f')).toBe('32°');
    expect(formatTemp(-0.2, 'c')).toBe('0°');
    expect(formatTemp(null, 'c')).toBe('–');
    expect(formatTemp(Number.NaN, 'c')).toBe('–');
  });

  it('formats wind and precipitation with unit labels', () => {
    expect(formatWind(16, 'kmh')).toBe('16 km/h');
    expect(formatWind(100, 'mph')).toBe('62 mph');
    expect(formatPrecip(25.4, 'in')).toBe('1.00 in');
    expect(formatPrecip(2.345, 'mm')).toBe('2.3 mm');
    expect(formatPrecip(null, 'mm')).toBe('–');
  });

  it('categorises UV on the WHO scale and reports missing values honestly', () => {
    expect(uvCategory(2)).toBe('Low');
    expect(uvCategory(3)).toBe('Moderate');
    expect(uvCategory(8)).toBe('Very high');
    expect(uvCategory(11)).toBe('Extreme');
    expect(uvCategory(null)).toBe('Unavailable');
  });
});

describe('weather code mapping', () => {
  it('maps known WMO codes to a kind and label', () => {
    expect(describeWeatherCode(0)).toEqual({ kind: 'clear', code: 0, label: 'Clear' });
    expect(describeWeatherCode(63).kind).toBe('rain');
    expect(describeWeatherCode(95).kind).toBe('thunderstorm');
    expect(describeWeatherCode(73).kind).toBe('snow');
  });

  it('treats unknown, missing, or non-integer codes as unknown rather than guessing', () => {
    expect(describeWeatherCode(4).kind).toBe('unknown');
    expect(describeWeatherCode(null).kind).toBe('unknown');
    expect(describeWeatherCode(1.5).kind).toBe('unknown');
    expect(describeWeatherCode(null).label).toBe('Conditions unavailable');
  });

  it('declares artwork coverage for every condition kind', () => {
    expect(ARTWORK_KINDS).toContain('thunderstorm');
    expect(new Set(ARTWORK_KINDS).size).toBe(ARTWORK_KINDS.length);
  });
});

describe('timezone-safe time formatting', () => {
  it('parses provider wall-clock strings without applying a timezone', () => {
    expect(parseWallClock('2026-10-14T14:30')).toEqual({ year: 2026, month: 10, day: 14, hour: 14, minute: 30 });
    expect(parseWallClock('2026-10-14')).toEqual({ year: 2026, month: 10, day: 14, hour: 0, minute: 0 });
    expect(parseWallClock('not a date')).toBeNull();
  });

  it('keeps the calendar day stable: a date never shifts weekday', () => {
    // 2026-10-14 is a Wednesday in every timezone, because we never convert.
    expect(formatWeekday('2026-10-14')).toBe('Wednesday');
    expect(formatWeekday('2026-10-14T00:00')).toBe('Wednesday');
    expect(formatWeekday('2026-10-14T23:59')).toBe('Wednesday');
    expect(formatLongDate('2026-10-14T14:30')).toBe('WEDNESDAY, 14 OCTOBER');
  });

  it('formats clock time in 12 and 24 hour modes', () => {
    expect(formatClock('2026-10-14T00:05', '24h')).toBe('00:05');
    expect(formatClock('2026-10-14T00:05', '12h')).toBe('12:05 AM');
    expect(formatClock('2026-10-14T12:00', '12h')).toBe('12:00 PM');
    expect(formatClock('2026-10-14T23:45', '12h')).toBe('11:45 PM');
    expect(formatHourLabel('2026-10-14T15:00', '12h')).toBe('3 PM');
  });

  it('floors timestamps to the hour key used to match hourly rows', () => {
    expect(hourKey('2026-10-14T14:30')).toBe('2026-10-14T14:00');
  });

  it('computes durations and daylight progress from local wall-clock values', () => {
    expect(minutesBetween('2026-10-14T05:48', '2026-10-14T18:32')).toBe(764);
    expect(formatDuration(764)).toBe('12 h 44 min');
    expect(formatDuration(null)).toBe('–');
    expect(daylightProgress('2026-10-14T12:00', '2026-10-14T06:00', '2026-10-14T18:00')).toBeCloseTo(0.5);
    expect(daylightProgress('2026-10-14T05:00', '2026-10-14T06:00', '2026-10-14T18:00')).toBeNull();
  });
});
