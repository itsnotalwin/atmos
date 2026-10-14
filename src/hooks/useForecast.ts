import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Forecast, Place } from '../types/weather';
import { fetchForecast, WeatherServiceError } from '../services/weather/openMeteo';
import { getFreshSnapshot, saveSnapshot } from '../storage/local';
import { useOnline } from './useOnline';

export type ForecastSource = 'live' | 'cached' | 'none';

export interface ForecastState {
  /** Forecast for exactly this place, live or cached. Never another place's data. */
  forecast: Forecast | null;
  source: ForecastSource;
  /** Set when the most recent live attempt failed. */
  error: WeatherServiceError | null;
  isFetching: boolean;
  /** True while the browser is offline and no live attempt can run. */
  waitingForNetwork: boolean;
  lastUpdated: string | null;
  refresh: () => void;
}

const LIVE_STALE_MS = 10 * 60 * 1000;

export function useForecast(place: Place): ForecastState {
  const online = useOnline();

  const query = useQuery({
    queryKey: ['forecast', place.id, place.latitude, place.longitude],
    queryFn: async ({ signal }) => {
      const f = await fetchForecast(place, { signal });
      saveSnapshot(window.localStorage, place.id, f, new Date());
      return f;
    },
    staleTime: LIVE_STALE_MS,
    refetchInterval: LIVE_STALE_MS,
    retry: 1,
    retryDelay: 1500,
  });

  // Snapshot is re-read whenever the live query settles, so it stays current.
  const snapshot = useMemo(() => {
    const s = getFreshSnapshot(window.localStorage, place.id, new Date());
    return s && s.forecast.place.id === place.id ? s.forecast : null;
    // query.dataUpdatedAt is the trigger for re-reading storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id, query.dataUpdatedAt]);

  const live = query.data && query.data.place.id === place.id ? query.data : null;
  const forecast = live ?? snapshot;
  const source: ForecastSource = live ? 'live' : snapshot ? 'cached' : 'none';

  const error = query.error instanceof WeatherServiceError ? query.error : query.error ? new WeatherServiceError('Unknown error', 'invalid') : null;

  return {
    forecast,
    source,
    error,
    isFetching: query.isFetching,
    waitingForNetwork: !online && forecast === null,
    lastUpdated: forecast ? forecast.fetchedAt : null,
    refresh: () => void query.refetch(),
  };
}
