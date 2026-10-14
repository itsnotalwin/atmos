import type { TimeFormat } from './units';

/**
 * Timezone-safe helpers for provider-local wall-clock strings.
 *
 * Input shapes: "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM" in the location's timezone.
 * We never construct a Date from these in local time. Components are read
 * directly and formatted via Date.UTC with timeZone: 'UTC', which means the
 * formatted output is the wall-clock time exactly as written by the provider.
 */

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

export function parseWallClock(value: string): WallClock | null {
  const m = WALL_RE.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: h === undefined ? 0 : Number(h),
    minute: mi === undefined ? 0 : Number(mi),
  };
}

/** Day of week 0 (Sun) to 6 (Sat) for a wall-clock date, without timezone effects. */
function weekdayIndex(c: WallClock): number {
  return new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay();
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatWeekday(dateOrWall: string, short = false): string {
  const c = parseWallClock(dateOrWall);
  if (!c) return '–';
  const names = short ? SHORT_WEEKDAYS : WEEKDAYS;
  return names[weekdayIndex(c)]!;
}

/** "WEDNESDAY, 14 OCTOBER" style. */
export function formatLongDate(dateOrWall: string): string {
  const c = parseWallClock(dateOrWall);
  if (!c) return '–';
  return `${WEEKDAYS[weekdayIndex(c)]!}, ${c.day} ${MONTHS[c.month - 1]!}`.toUpperCase();
}

export function formatShortDate(dateOrWall: string): string {
  const c = parseWallClock(dateOrWall);
  if (!c) return '–';
  return `${c.day} ${MONTHS[c.month - 1]!.slice(0, 3)}`;
}

export function formatClock(value: string, format: TimeFormat): string {
  const c = parseWallClock(value);
  if (!c) return '–';
  if (format === '24h') {
    return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
  }
  const h12 = c.hour % 12 === 0 ? 12 : c.hour % 12;
  const suffix = c.hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(c.minute).padStart(2, '0')} ${suffix}`;
}

/** Hour label for charts: "14:00" or "2 PM". */
export function formatHourLabel(value: string, format: TimeFormat): string {
  const c = parseWallClock(value);
  if (!c) return '–';
  if (format === '24h') return `${String(c.hour).padStart(2, '0')}:00`;
  const h12 = c.hour % 12 === 0 ? 12 : c.hour % 12;
  return `${h12} ${c.hour < 12 ? 'AM' : 'PM'}`;
}

/** Hour key "YYYY-MM-DDTHH:00" for a wall-clock timestamp (minutes floored). */
export function hourKey(value: string): string {
  const c = parseWallClock(value);
  if (!c) return value;
  return `${value.slice(0, 10)}T${String(c.hour).padStart(2, '0')}:00`;
}

/** Duration in minutes between two wall-clock timestamps in the same location. */
export function minutesBetween(startValue: string, endValue: string): number | null {
  const a = parseWallClock(startValue);
  const b = parseWallClock(endValue);
  if (!a || !b) return null;
  const ms = (c: WallClock) => Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute);
  return Math.round((ms(b) - ms(a)) / 60000);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 0) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

/** Fraction of the day elapsed at `now` between sunrise and sunset, or null if outside. */
export function daylightProgress(nowWall: string, sunrise: string, sunset: string): number | null {
  const now = minutesBetween(sunrise, nowWall);
  const total = minutesBetween(sunrise, sunset);
  if (now === null || total === null || total <= 0) return null;
  if (now < 0 || now > total) return null;
  return now / total;
}
