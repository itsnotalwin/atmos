import { describe, expect, it, beforeEach } from 'vitest';
import { normalizeForecast, fetchForecast, WeatherServiceError, buildForecastUrl } from '../src/services/weather/openMeteo';
import { normalizePlaces } from '../src/services/geocoding/search';
import { buildNarrative } from '../src/utils/narrative';
import {
  loadPlaces,
  savePlaces,
  loadPrefs,
  savePrefs,
  saveSnapshot,
  getFreshSnapshot,
  SNAPSHOT_MAX_AGE_MS,
  KEYS,
  type Storage,
} from '../src/storage/local';
import type { Forecast, Place } from '../src/types/weather';
import { DEFAULT_UNITS } from '../src/utils/units';

const PLACE: Place = {
  id: 'jhb',
  name: 'Johannesburg',
  region: 'Gauteng',
  country: 'South Africa',
  countryCode: 'ZA',
  latitude: -26.2,
  longitude: 28.04,
  timezone: 'Africa/Johannesburg',
};

const RAW = {
  current: {
    time: '2026-10-14T14:30',
    temperature_2m: 25.3,
    apparent_temperature: 26.1,
    relative_humidity_2m: 40,
    weather_code: 0,
    wind_speed_10m: 12.5,
    wind_direction_10m: 200,
    precipitation: 0,
    cloud_cover: 10,
    is_day: 1,
  },
  hourly: {
    time: ['2026-10-14T13:00', '2026-10-14T14:00', '2026-10-14T15:00', '2026-10-14T16:00', '2026-10-14T17:00'],
    temperature_2m: [24, 25, 26, 27, 20],
    apparent_temperature: [25, 26, 27, 28, 20],
    precipitation_probability: [0, 10, 70, 80, 90],
    precipitation: [0, 0, 0.4, 1.2, 2],
    weather_code: [0, 0, 61, 63, 95],
    wind_speed_10m: [10, 11, 12, 13, 14],
    uv_index: [6, 7, null, 3],
    is_day: [1, 1, 1, 1, 0],
  },
  daily: {
    time: ['2026-10-14', '2026-10-15'],
    weather_code: [0, 'x'],
    temperature_2m_max: [27, 22],
    temperature_2m_min: [14, null],
    sunrise: ['2026-10-14T05:48', '2026-10-15T05:47'],
    sunset: ['2026-10-14T18:32', null],
    precipitation_sum: [0, 4.2],
    precipitation_probability_max: [5, 80],
    uv_index_max: [9.1],
  },
};

describe('Open-Meteo normalization', () => {
  it('maps current, hourly and daily values into the domain model', () => {
    const f = normalizeForecast(RAW, PLACE, '2026-10-14T12:31:00.000Z');
    expect(f.current.temperatureC).toBe(25.3);
    expect(f.current.condition.kind).toBe('clear');
    expect(f.current.isDay).toBe(true);
    expect(f.hourly).toHaveLength(5);
    expect(f.hourly[2]!.condition.kind).toBe('rain');
    expect(f.hourly[4]!.isDay).toBe(false);
    expect(f.daily[0]!.maxC).toBe(27);
    expect(f.daily[0]!.sunrise).toBe('2026-10-14T05:48');
  });

  it('represents missing values as null, never as zero or invented numbers', () => {
    const f = normalizeForecast(RAW, PLACE, 'x');
    expect(f.hourly[3]!.uvIndex).toBe(3);
    expect(f.hourly[2]!.uvIndex).toBeNull(); // array entry is null
    expect(f.hourly[4]!.uvIndex).toBeNull(); // array is shorter than time
    expect(f.daily[1]!.minC).toBeNull();
    expect(f.daily[1]!.sunset).toBeNull();
    expect(f.daily[1]!.condition.kind).toBe('unknown'); // "x" is not a WMO code
  });

  it('rejects responses without current conditions instead of guessing', () => {
    expect(() => normalizeForecast({ hourly: {} }, PLACE, 'x')).toThrow(WeatherServiceError);
    expect(() => normalizeForecast(null, PLACE, 'x')).toThrow(WeatherServiceError);
  });

  it('builds a request with timezone=auto and metric canonical units', () => {
    const url = buildForecastUrl(PLACE);
    expect(url).toContain('timezone=auto');
    expect(url).toContain('wind_speed_unit=kmh');
    expect(url).toContain('precipitation_unit=mm');
    expect(url).toContain('latitude=-26.2000');
  });
});

describe('fetchForecast error handling', () => {
  it('reports network failures, HTTP errors and unreadable bodies distinctly', async () => {
    const offline = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(fetchForecast(PLACE, { fetchImpl: offline })).rejects.toMatchObject({ kind: 'network' });

    const http500 = (async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    await expect(fetchForecast(PLACE, { fetchImpl: http500 })).rejects.toMatchObject({ kind: 'http', status: 500 });

    const garbage = (async () => new Response('<html>', { status: 200 })) as unknown as typeof fetch;
    await expect(fetchForecast(PLACE, { fetchImpl: garbage })).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('returns a normalized forecast stamped with the fetch time', async () => {
    const ok = (async () => new Response(JSON.stringify(RAW), { status: 200 })) as unknown as typeof fetch;
    const f = await fetchForecast(PLACE, { fetchImpl: ok, now: () => new Date('2026-10-14T12:31:00Z') });
    expect(f.fetchedAt).toBe('2026-10-14T12:31:00.000Z');
    expect(f.place.name).toBe('Johannesburg');
  });
});

describe('geocoding normalization', () => {
  it('treats a missing results key as no matches', () => {
    expect(normalizePlaces({ generationtime_ms: 1 })).toEqual([]);
  });

  it('keeps region and timezone so same-named cities can be told apart', () => {
    const places = normalizePlaces({
      results: [
        { name: 'Johannesburg', latitude: -26.2, longitude: 28.04, country: 'South Africa', admin1: 'Gauteng', timezone: 'Africa/Johannesburg' },
        { name: 'Johannesburg', latitude: 35.37, longitude: -117.63, country: 'United States', admin1: 'California', timezone: 'America/Los_Angeles' },
        { name: 'Broken', latitude: 'x', longitude: 1, timezone: 'UTC' },
      ],
    });
    expect(places).toHaveLength(2);
    expect(places[0]!.region).toBe('Gauteng');
    expect(places[1]!.region).toBe('California');
    expect(places[0]!.id).not.toBe(places[1]!.id);
  });
});

describe('narrative engine', () => {
  const forecast = normalizeForecast(RAW, PLACE, 'x') as Forecast;

  it('describes the current condition from actual data', () => {
    expect(buildNarrative(forecast, 'c')).toMatch(/^A clear afternoon\./);
  });

  it('mentions likely rain only when probability in the next 12 hours is high', () => {
    const text = buildNarrative({ ...forecast, current: { ...forecast.current, condition: { kind: 'clear', code: 0, label: 'Clear' } } }, 'c');
    expect(text).toContain('Rain is likely around 15:00.');
  });

  it('does not claim anything for an unknown condition beyond saying it is unavailable', () => {
    const unknown = { ...forecast, current: { ...forecast.current, condition: { kind: 'unknown' as const, code: null, label: 'x' } } };
    expect(buildNarrative(unknown, 'c')).toMatch(/unavailable/);
  });
});

function memoryStorage(): Storage & { dump: () => Record<string, string> } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

describe('local persistence', () => {
  let store: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    store = memoryStorage();
  });

  it('round-trips saved places and the active selection', () => {
    savePlaces(store, { items: [PLACE], activeId: 'jhb' });
    expect(loadPlaces(store)).toEqual({ items: [PLACE], activeId: 'jhb' });
  });

  it('discards corrupt JSON and falls back to empty defaults', () => {
    store.setItem(KEYS.places, '{not json');
    expect(loadPlaces(store)).toEqual({ items: [], activeId: null });
    store.setItem(KEYS.prefs, '"string"');
    expect(loadPrefs(store).units).toEqual(DEFAULT_UNITS);
  });

  it('persists unit and theme preferences and rejects invalid values', () => {
    savePrefs(store, { units: { ...DEFAULT_UNITS, temp: 'f', time: '12h' }, theme: 'dark' });
    expect(loadPrefs(store)).toMatchObject({ theme: 'dark', units: { temp: 'f', time: '12h' } });
    store.setItem(KEYS.prefs, JSON.stringify({ units: { temp: 'k' }, theme: 'neon' }));
    expect(loadPrefs(store)).toMatchObject({ theme: 'light', units: DEFAULT_UNITS });
  });

  it('caps saved places at six', () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ ...PLACE, id: `p${i}` }));
    savePlaces(store, { items, activeId: 'p0' });
    expect(loadPlaces(store).items).toHaveLength(6);
  });

  it('expires snapshots after the maximum age', () => {
    const now = new Date('2026-10-14T12:00:00Z');
    const f = normalizeForecast(RAW, PLACE, now.toISOString());
    saveSnapshot(store, 'jhb', f, now);
    expect(getFreshSnapshot(store, 'jhb', now)).not.toBeNull();
    const later = new Date(now.getTime() + SNAPSHOT_MAX_AGE_MS + 1);
    expect(getFreshSnapshot(store, 'jhb', later)).toBeNull();
  });
});
