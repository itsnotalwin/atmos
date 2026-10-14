import type { Forecast, Place } from '../types/weather';
import { DEFAULT_UNITS, type ThemePref, type UnitPrefs } from '../utils/units';

/**
 * Local persistence. Everything lives in localStorage under versioned keys.
 * Reads are defensive: a corrupt or foreign value is discarded, never thrown.
 */

export const KEYS = {
  places: 'atmos.places.v1',
  prefs: 'atmos.prefs.v1',
  snapshots: 'atmos.snapshots.v1',
} as const;

/** Snapshots older than this are not shown as "last known" weather. */
export const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const FALLBACK_PLACE: Place = {
  id: 'fallback-johannesburg',
  name: 'Johannesburg',
  region: 'Gauteng',
  country: 'South Africa',
  countryCode: 'ZA',
  latitude: -26.2023,
  longitude: 28.0436,
  timezone: 'Africa/Johannesburg',
  isFallback: true,
};

export interface StoredPrefs {
  units: UnitPrefs;
  theme: ThemePref;
}

export const DEFAULT_PREFS: StoredPrefs = { units: DEFAULT_UNITS, theme: 'light' };

export interface StoredPlaces {
  items: Place[];
  activeId: string | null;
}

export interface Snapshot {
  forecast: Forecast;
  savedAt: string;
}

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function readJson<T>(store: Storage, key: string, validate: (v: unknown) => v is T): T | null {
  try {
    const raw = store.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeJson(store: Storage, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled. The app keeps working in memory.
  }
}

function isPlace(v: unknown): v is Place {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p['id'] === 'string' &&
    typeof p['name'] === 'string' &&
    typeof p['country'] === 'string' &&
    typeof p['latitude'] === 'number' &&
    typeof p['longitude'] === 'number' &&
    typeof p['timezone'] === 'string'
  );
}

export function loadPlaces(store: Storage): StoredPlaces {
  const v = readJson<StoredPlaces>(
    store,
    KEYS.places,
    (x): x is StoredPlaces =>
      typeof x === 'object' &&
      x !== null &&
      Array.isArray((x as StoredPlaces).items) &&
      (x as StoredPlaces).items.every(isPlace),
  );
  if (!v) return { items: [], activeId: null };
  const activeId = v.items.some((p) => p.id === v.activeId) ? v.activeId : v.items[0]?.id ?? null;
  return { items: v.items.slice(0, 6), activeId };
}

export function savePlaces(store: Storage, value: StoredPlaces): void {
  writeJson(store, KEYS.places, value);
}

export function loadPrefs(store: Storage): StoredPrefs {
  const v = readJson<Partial<StoredPrefs>>(store, KEYS.prefs, (x): x is Partial<StoredPrefs> => typeof x === 'object' && x !== null);
  if (!v) return DEFAULT_PREFS;
  const units = { ...DEFAULT_UNITS, ...(v.units ?? {}) };
  const validUnits =
    (units.temp === 'c' || units.temp === 'f') &&
    (units.wind === 'kmh' || units.wind === 'mph') &&
    (units.precip === 'mm' || units.precip === 'in') &&
    (units.time === '12h' || units.time === '24h');
  const theme: ThemePref = v.theme === 'dark' || v.theme === 'system' ? v.theme : 'light';
  return { units: validUnits ? units : DEFAULT_UNITS, theme };
}

export function savePrefs(store: Storage, value: StoredPrefs): void {
  writeJson(store, KEYS.prefs, value);
}

export function loadSnapshots(store: Storage): Record<string, Snapshot> {
  const v = readJson<Record<string, Snapshot>>(
    store,
    KEYS.snapshots,
    (x): x is Record<string, Snapshot> => typeof x === 'object' && x !== null && !Array.isArray(x),
  );
  return v ?? {};
}

export function saveSnapshot(store: Storage, placeId: string, forecast: Forecast, now: Date): void {
  const all = loadSnapshots(store);
  all[placeId] = { forecast, savedAt: now.toISOString() };
  // Keep only the most recent snapshots and drop expired ones.
  const kept = Object.entries(all)
    .filter(([, s]) => now.getTime() - Date.parse(s.savedAt) <= SNAPSHOT_MAX_AGE_MS)
    .sort((a, b) => Date.parse(b[1].savedAt) - Date.parse(a[1].savedAt))
    .slice(0, 12);
  writeJson(store, KEYS.snapshots, Object.fromEntries(kept));
}

export function getFreshSnapshot(store: Storage, placeId: string, now: Date): Snapshot | null {
  const s = loadSnapshots(store)[placeId];
  if (!s) return null;
  if (now.getTime() - Date.parse(s.savedAt) > SNAPSHOT_MAX_AGE_MS) return null;
  return s;
}

export function clearAllData(store: Storage): void {
  Object.values(KEYS).forEach((k) => store.removeItem(k));
}
