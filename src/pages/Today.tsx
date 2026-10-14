import { useAppState } from '../state/AppState';
import { useForecast } from '../hooks/useForecast';
import { ForecastGate, StatusLine } from '../components/weather/shared';
import { WeatherArt } from '../components/artwork/WeatherArt';
import { HourlyChart } from '../components/charts/HourlyChart';
import { Sunline } from '../components/weather/Sunline';
import { buildNarrative } from '../utils/narrative';
import { formatLongDate, hourKey, formatDuration, minutesBetween } from '../utils/time';
import { formatPercent, formatPrecip, formatTemp, formatUv, formatWind, uvCategory } from '../utils/units';
import type { Forecast } from '../types/weather';
import { Link } from 'react-router-dom';
import { compass, placeLabel } from '../components/weather/shared';
import { useLocalTitle } from '../hooks/useLocalTitle';
import { formatHourLabel } from '../utils/time';
import type { UnitPrefs } from '../utils/units';

export function TodayPage() {
  const { activePlace, units, prefs } = useAppState();
  const state = useForecast(activePlace);
  useLocalTitle('Today');

  return (
    <main id="main" className="page">
      <ForecastGate state={state} place={activePlace}>
        {(f, source) => (
          <TodayView
            forecast={f}
            source={source}
            units={units}
            format={prefs.units.time}
            onRefresh={state.refresh}
            refreshing={state.isFetching}
          />
        )}
      </ForecastGate>
    </main>
  );
}

function TodayView({
  forecast: f,
  source,
  units,
  format,
  onRefresh,
  refreshing,
}: {
  forecast: Forecast;
  source: 'live' | 'cached';
  units: UnitPrefs;
  format: '12h' | '24h';
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const cur = f.current;
  const today = f.daily[0];
  const nowKey = hourKey(cur.observedAt);
  const startIdx = Math.max(0, f.hourly.findIndex((h) => h.time >= nowKey));
  const nextHours = f.hourly.slice(startIdx, startIdx + 24);
  const nowHour = f.hourly.find((h) => hourKey(h.time) === nowKey);
  const narrative = buildNarrative(f, units.temp);
  const tz = f.place.timezone;

  return (
    <>
      <section className="hero" aria-labelledby="today-title">
        <div className="hero__text">
          <p className="eyebrow">{formatLongDate(cur.observedAt)}</p>
          <h1 id="today-title" className="hero__place">
            {placeLabel(f.place)}
          </h1>
          {f.place.isFallback && (
            <p className="meta">Default city, not your detected location.</p>
          )}
          <div className="hero__temp-row">
            <p className="display-temp" aria-label={`Current temperature ${formatTemp(cur.temperatureC, units.temp)}`}>
              {formatTemp(cur.temperatureC, units.temp)}
            </p>
          </div>
          <p className="statement">{narrative}</p>
          <div className="hero__facts">
            <span>
              Feels like <strong>{formatTemp(cur.feelsLikeC, units.temp)}</strong>
            </span>
            <span>
              High <strong>{formatTemp(today?.maxC ?? null, units.temp)}</strong>
            </span>
            <span>
              Low <strong>{formatTemp(today?.minC ?? null, units.temp)}</strong>
            </span>
            <span>{cur.condition.label}</span>
          </div>
          <StatusLine forecast={f} source={source} timezone={tz} format={format} onRefresh={onRefresh} refreshing={refreshing} />
        </div>
        <div className="hero__art">
          <WeatherArt kind={cur.condition.kind} isDay={cur.isDay} />
        </div>
      </section>

      <section className="section" aria-labelledby="conditions-title">
        <h2 id="conditions-title" className="visually-hidden">
          Current conditions
        </h2>
        <ul className="conditions">
          <li>
            <span className="conditions__label">Feels like</span>
            <span className="conditions__value">{formatTemp(cur.feelsLikeC, units.temp)}</span>
            <span className="conditions__sub">Apparent temperature</span>
          </li>
          <li>
            <span className="conditions__label">Humidity</span>
            <span className="conditions__value">{formatPercent(cur.humidityPercent)}</span>
            <span className="conditions__sub">Relative</span>
          </li>
          <li>
            <span className="conditions__label">Wind</span>
            <span className="conditions__value">{formatWind(cur.windSpeedKmh, units.wind)}</span>
            <span className="conditions__sub">
              {cur.windDirectionDegrees === null ? 'Direction unavailable' : `From ${compass(cur.windDirectionDegrees)} (${Math.round(cur.windDirectionDegrees)}°)`}
            </span>
          </li>
          <li>
            <span className="conditions__label">UV index</span>
            <span className="conditions__value">{formatUv(nowHour?.uvIndex ?? null)}</span>
            <span className="conditions__sub">{uvCategory(nowHour?.uvIndex ?? null)}</span>
          </li>
          <li>
            <span className="conditions__label">Precipitation</span>
            <span className="conditions__value">{formatPrecip(cur.precipitationMm, units.precip)}</span>
            <span className="conditions__sub">Chance today {formatPercent(today?.precipitationProbabilityMaxPercent ?? null)}</span>
          </li>
          <li>
            <span className="conditions__label">Cloud cover</span>
            <span className="conditions__value">{formatPercent(cur.cloudCoverPercent)}</span>
            <span className="conditions__sub">Sky</span>
          </li>
        </ul>
      </section>

      <section className="section grid-two" aria-labelledby="sun-title">
        <div className="stack">
          <h2 id="sun-title" className="section-title">
            Daylight
          </h2>
          <Sunline
            sunrise={today?.sunrise ?? null}
            sunset={today?.sunset ?? null}
            now={cur.observedAt}
            format={format}
            durationLabel={formatDuration(today ? minutesBetween(today.sunrise ?? '', today.sunset ?? '') : null)}
          />
        </div>
        <div className="stack">
          <HourlyChart points={nextHours} units={units} nowKey={nowKey} label={placeLabel(f.place)} />
        </div>
      </section>

      <section className="section" aria-labelledby="week-link">
        <hr className="rule" />
        <div className="page-head__row" style={{ paddingTop: 24 }}>
          <h2 id="week-link" className="component-title">
            The week ahead
          </h2>
          <Link to="/forecast" className="btn btn--ghost">
            Seven-day forecast
          </Link>
        </div>
      </section>

      <footer className="colophon">
        <span>Weather data by Open-Meteo.com. Values are the service's own; ATMOS does not adjust them.</span>
        <span>
          Showing {formatHourLabel(cur.observedAt, format)} local time in {f.place.timezone}
        </span>
      </footer>
    </>
  );
}

