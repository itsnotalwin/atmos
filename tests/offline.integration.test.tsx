import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppStateProvider } from '../src/state/AppState';
import { useForecast } from '../src/hooks/useForecast';
import { normalizeForecast } from '../src/services/weather/openMeteo';
import { ForecastGate } from '../src/components/weather/shared';
import { saveSnapshot, KEYS } from '../src/storage/local';
import type { Place } from '../src/types/weather';

/**
 * Integration tests: real hooks, real storage, mocked network.
 * Covers live, cached-offline, failure-with-cache, failure-without-cache,
 * and offline-without-cache. These are the acceptance paths for offline data.
 */

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
    wind_speed_10m: 12,
    wind_direction_10m: 90,
    precipitation: 0,
    cloud_cover: 10,
    is_day: 1,
  },
  hourly: { time: ['2026-10-14T14:00'], temperature_2m: [25], weather_code: [0], precipitation_probability: [0], is_day: [1] },
  daily: { time: ['2026-10-14'], temperature_2m_max: [27], temperature_2m_min: [14], weather_code: [0] },
};

function Probe() {
  const state = useForecast(PLACE);
  return (
    <ForecastGate state={state} place={PLACE}>
      {(f, source) => (
        <div>
          <p>Temp {Math.round(f.current.temperatureC)}</p>
          <p>{source === 'cached' ? 'Cached forecast' : 'Live'}</p>
        </div>
      )}
    </ForecastGate>
  );
}

function renderProbe() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AppStateProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>
    </QueryClientProvider>,
  );
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

describe('offline-first forecast behaviour', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setOnline(true);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a live forecast when the network answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(RAW), { status: 200 })));
    renderProbe();
    expect(await screen.findByText('Temp 25')).toBeTruthy();
    expect(screen.getByText('Live')).toBeTruthy();
    // The live result is persisted for later offline reading.
    expect(window.localStorage.getItem(KEYS.snapshots)).toContain('jhb');
  });

  it('labels stored data as cached when the live request fails', async () => {
    const stored = normalizeForecast(RAW, PLACE, '2026-10-14T10:00:00.000Z');
    saveSnapshot(window.localStorage, PLACE.id, stored, new Date());
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));
    renderProbe();
    expect(await screen.findByText('Temp 25')).toBeTruthy();
    expect(screen.getByText('Cached forecast')).toBeTruthy();
    // The snapshot renders at once; the failure note appears when the request settles.
    expect(await screen.findByText(/Refresh failed/, undefined, { timeout: 4000 })).toBeTruthy();
  });

  it('shows an honest error, with no invented values, when nothing is stored', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));
    renderProbe();
    expect(await screen.findByText('Could not reach the weather service.', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.queryByText(/Temp \d/)).toBeNull();
  });

  it('shows the offline empty state on launch with no cache and no connection', async () => {
    setOnline(false);
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    renderProbe();
    expect(await screen.findByText('You are offline.')).toBeTruthy();
    expect(screen.queryByText(/Temp \d/)).toBeNull();
  });

  it('never returns a snapshot that belongs to a different place', async () => {
    const other = normalizeForecast(RAW, { ...PLACE, id: 'elsewhere' }, '2026-10-14T10:00:00.000Z');
    saveSnapshot(window.localStorage, 'elsewhere', other, new Date());
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));
    renderProbe();
    await waitFor(() => expect(screen.queryByText('Cached forecast')).toBeNull(), { timeout: 4000 });
  });
});
