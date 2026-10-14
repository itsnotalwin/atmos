import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { useForecast } from '../hooks/useForecast';
import { ForecastGate, placeLabel } from '../components/weather/shared';
import { WeatherArt } from '../components/artwork/WeatherArt';
import { HourlyChart } from '../components/charts/HourlyChart';
import { Notice } from '../components/ui/States';
import { formatClock, formatDuration, formatLongDate, formatWeekday, minutesBetween } from '../utils/time';
import { formatPercent, formatPrecip, formatTemp, formatUv, formatWind, uvCategory } from '../utils/units';
import type { Forecast } from '../types/weather';
import type { UnitPrefs } from '../utils/units';
import { useLocalTitle } from '../hooks/useLocalTitle';

export function DayDetailPage() {
  const { date = '' } = useParams();
  const { activePlace, units, prefs } = useAppState();
  const state = useForecast(activePlace);
  useLocalTitle('Day detail');

  return (
    <main id="main" className="page">
      <Link to="/forecast" className="btn--link" style={{ display: 'inline-flex', marginBottom: 24 }}>
        ← Seven days
      </Link>
      <ForecastGate state={state} place={activePlace}>
        {(f) => {
          const day = f.daily.find((d) => d.date === date);
          if (!day) {
            return (
              <Notice title="That day is outside the forecast." action={<Link to="/forecast" className="btn btn--ghost">Back to seven days</Link>}>
                The forecast covers seven days from today for {placeLabel(f.place)}.
              </Notice>
            );
          }
          const hours = f.hourly.filter((h) => h.time.startsWith(date));
          const dayRain = hours.reduce<number | null>((acc, h) => (h.precipitationMm === null ? acc : (acc ?? 0) + h.precipitationMm), null);
          const maxWind = hours.reduce<number | null>((acc, h) => (h.windSpeedKmh === null ? acc : Math.max(acc ?? 0, h.windSpeedKmh)), null);
          const uvPeak = day.uvIndexMax;
          const observations = buildObservations(hours, units);
          return (
            <article aria-labelledby="day-title">
              <header className="page-head">
                <p className="eyebrow">{formatLongDate(date)}</p>
                <h1 id="day-title" className="section-title" style={{ fontSize: 'clamp(56px, 9vw, 96px)' }}>
                  {formatWeekday(date)}
                </h1>
                <p className="statement" style={{ maxWidth: '24ch' }}>
                  {day.condition.label}, with a high of {formatTemp(day.maxC, units.temp)} and a low of {formatTemp(day.minC, units.temp)}.
                </p>
              </header>

              <div className="grid-two">
                <div className="stack" style={{ gap: 32 }}>
                  <dl className="conditions" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <Metric label="High" value={formatTemp(day.maxC, units.temp)} />
                    <Metric label="Low" value={formatTemp(day.minC, units.temp)} />
                    <Metric label="Rain chance" value={formatPercent(day.precipitationProbabilityMaxPercent)} />
                    <Metric label="Expected rain" value={formatPrecip(day.precipitationSumMm ?? dayRain, units.precip)} />
                    <Metric label="Wind peak" value={formatWind(maxWind, units.wind)} />
                    <Metric label="UV peak" value={formatUv(uvPeak)} sub={uvCategory(uvPeak)} />
                  </dl>
                  <dl className="meta" style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 20px', margin: 0, fontSize: 14 }}>
                    <dt>Sunrise</dt>
                    <dd style={{ margin: 0 }}>{day.sunrise ? formatClock(day.sunrise, prefs.units.time) : 'Unavailable'}</dd>
                    <dt>Sunset</dt>
                    <dd style={{ margin: 0 }}>{day.sunset ? formatClock(day.sunset, prefs.units.time) : 'Unavailable'}</dd>
                    <dt>Daylight</dt>
                    <dd style={{ margin: 0 }}>{formatDuration(day.sunrise && day.sunset ? minutesBetween(day.sunrise, day.sunset) : null)}</dd>
                  </dl>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--ink-2)' }} aria-label="Observations from the forecast">
                    {observations.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="stack">
                  <WeatherArt kind={day.condition.kind} isDay />
                </div>
              </div>

              <section className="section" aria-label="Temperature through the day">
                {hours.length > 0 ? (
                  <HourlyChart points={hours} units={units} nowKey={null} label={`${formatWeekday(date)} in ${placeLabel(f.place)}`} title="Temperature through the day" />
                ) : (
                  <Notice title="Hourly values are unavailable for this day." />
                )}
              </section>
            </article>
          );
        }}
      </ForecastGate>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="conditions__label">{label}</dt>
      <dd className="conditions__value" style={{ margin: 0 }}>
        {value}
      </dd>
      {sub && <span className="conditions__sub">{sub}</span>}
    </div>
  );
}

/** Factual sentences computed from the day's own hourly values. */
function buildObservations(hours: Forecast['hourly'], units: UnitPrefs): string[] {
  const out: string[] = [];
  const withTemp = hours.filter((h) => h.temperatureC !== null);
  if (withTemp.length) {
    const warm = withTemp.reduce((a, b) => (b.temperatureC! > a.temperatureC! ? b : a));
    const cool = withTemp.reduce((a, b) => (b.temperatureC! < a.temperatureC! ? b : a));
    out.push(`Warmest around ${formatClock(warm.time, units.time)} at ${formatTemp(warm.temperatureC, units.temp)}.`);
    out.push(`Coolest around ${formatClock(cool.time, units.time)} at ${formatTemp(cool.temperatureC, units.temp)}.`);
  }
  const rainy = hours.filter((h) => (h.precipitationProbabilityPercent ?? 0) >= 50);
  if (rainy.length) {
    out.push(`Rain is at least 50% likely in ${rainy.length} of 24 hours, from ${formatClock(rainy[0]!.time, units.time)}.`);
  } else if (hours.some((h) => h.precipitationProbabilityPercent !== null)) {
    out.push('Rain is not forecast to be likely at any hour of this day.');
  }
  return out;
}
