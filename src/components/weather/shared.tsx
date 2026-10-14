import type { Forecast, Place } from '../../types/weather';
import { formatPercent, formatTemp, formatWind } from '../../utils/units';
import type { UnitPrefs } from '../../utils/units';
import { WeatherServiceError } from '../../services/weather/openMeteo';
import type { ForecastState } from '../../hooks/useForecast';
import { Notice, Skeleton } from '../ui/States';

export function placeLabel(p: Place): string {
  return [p.name, p.region, p.country].filter((x): x is string => Boolean(x && x.trim())).join(', ');
}

export function formatUpdated(iso: string, timezone: string, format: '12h' | '24h'): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

export function compass(deg: number | null): string {
  if (deg === null || !Number.isFinite(deg)) return '';
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return names[Math.round((((deg % 360) + 360) % 360) / 45) % 8]!;
}

/** Honest status: says whether data is live, cached, and when it was updated. */
export function StatusLine({ forecast, source, timezone, format, onRefresh, refreshing }: {
  forecast: Forecast;
  source: 'live' | 'cached' | 'none';
  timezone: string;
  format: '12h' | '24h';
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const time = formatUpdated(forecast.fetchedAt, timezone, format);
  const isCached = source === 'cached';
  return (
    <div className={`status ${isCached ? 'status--cached' : ''}`} role="status">
      <span className="status__dot" aria-hidden="true" />
      <span>
        {isCached
          ? `Cached forecast, last updated ${time}. Not live.`
          : `Live, updated ${time}`}
      </span>
      <button type="button" className="btn btn--link" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

function errorCopy(err: WeatherServiceError | null): { title: string; body: string } {
  if (!err) return { title: 'Weather is not available yet.', body: 'Try again in a moment.' };
  switch (err.kind) {
    case 'network':
      return { title: 'Could not reach the weather service.', body: 'Check your connection, then try again. Nothing on this screen is invented; we show only what the service returns.' };
    case 'http':
      return { title: 'The weather service is unavailable right now.', body: `The service responded with status ${err.status ?? 'unknown'}. It usually recovers within minutes.` };
    case 'invalid':
      return { title: 'The weather service returned data we could not read.', body: 'We have not displayed any values for this place.' };
    default:
      return { title: 'Weather is not available yet.', body: 'Try again in a moment.' };
  }
}

/**
 * Renders the children only when a forecast for the active place exists.
 * Handles: offline with no cache, loading skeleton, and failure with recovery.
 */
export function ForecastGate({
  state,
  place,
  children,
}: {
  state: ForecastState;
  place: Place;
  children: (f: Forecast, source: 'live' | 'cached') => React.ReactNode;
}) {
  const { forecast, source, error, waitingForNetwork, refresh, isFetching } = state;

  if (forecast && source !== 'none') {
    const cachedNote =
      source === 'cached' && error ? (
        <p className="meta" style={{ marginBottom: 16 }} role="status">
          Refresh failed. Showing the cached forecast. {errorCopy(error).title}
        </p>
      ) : null;
    return (
      <>
        {cachedNote}
        {children(forecast, source)}
      </>
    );
  }

  if (waitingForNetwork) {
    return (
      <Notice
        title="You are offline."
        action={
          <button type="button" className="btn btn--ghost" onClick={refresh}>
            Check again
          </button>
        }
      >
        {`No forecast is stored for ${place.name} on this device yet. Connect once to load it. After that it stays available offline, labeled as cached.`}
      </Notice>
    );
  }

  if (error) {
    const copy = errorCopy(error);
    return (
      <Notice
        title={copy.title}
        tone="alert"
        action={
          <button type="button" className="btn" onClick={refresh} disabled={isFetching}>
            {isFetching ? 'Trying…' : 'Try again'}
          </button>
        }
      >
        {copy.body}
      </Notice>
    );
  }

  return <Skeleton label={`Loading the forecast for ${place.name}`} />;
}

export function ConditionTemp({ value, units }: { value: number | null; units: UnitPrefs }) {
  return <>{formatTemp(value, units.temp)}</>;
}

export { formatPercent, formatWind };
