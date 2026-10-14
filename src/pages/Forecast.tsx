import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { useForecast } from '../hooks/useForecast';
import { ForecastGate, placeLabel } from '../components/weather/shared';
import { formatPercent, formatTemp } from '../utils/units';
import { formatShortDate, formatWeekday } from '../utils/time';
import { useLocalTitle } from '../hooks/useLocalTitle';
import type { DailyPoint, Forecast } from '../types/weather';

export function ForecastPage() {
  const { activePlace, units } = useAppState();
  const state = useForecast(activePlace);
  useLocalTitle('Seven-day forecast');

  return (
    <main id="main" className="page">
      <div className="page-head">
        <p className="eyebrow">Seven days</p>
        <h1 className="section-title">{placeLabel(activePlace)}</h1>
      </div>
      <ForecastGate state={state} place={activePlace}>
        {(f) => <WeekList forecast={f} units={units} />}
      </ForecastGate>
    </main>
  );
}

function WeekList({ forecast, units }: { forecast: Forecast; units: { temp: 'c' | 'f' } }) {
  const days = forecast.daily;
  const lows = days.map((d) => d.minC).filter((v): v is number => v !== null);
  const highs = days.map((d) => d.maxC).filter((v): v is number => v !== null);
  const lo = lows.length ? Math.min(...lows) : 0;
  const hi = highs.length ? Math.max(...highs) : 1;
  const span = Math.max(hi - lo, 1);

  return (
    <ol className="days" aria-label="Daily forecast">
      {days.map((d, i) => (
        <li key={d.date}>
          <Link to={`/forecast/${d.date}`} className="day-row" aria-label={`${i === 0 ? 'Today' : formatWeekday(d.date)}, ${d.condition.label}, high ${formatTemp(d.maxC, units.temp)}, low ${formatTemp(d.minC, units.temp)}`}>
            <div>
              <div className="day-row__name">{i === 0 ? 'Today' : formatWeekday(d.date)}</div>
              <div className="meta">{formatShortDate(d.date)}</div>
            </div>
            <div className="day-row__cond" style={{ display: 'grid', gap: 4 }}>
              <span>{d.condition.label}</span>
              <span className="meta">Rain chance {formatPercent(d.precipitationProbabilityMaxPercent)}</span>
            </div>
            <div className="day-row__temps">
              {formatTemp(d.maxC, units.temp)}
              <small>{formatTemp(d.minC, units.temp)} low</small>
            </div>
            <div className="day-row__range">
              <RangeBar day={d} lo={lo} span={span} />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function RangeBar({ day, lo, span }: { day: DailyPoint; lo: number; span: number }) {
  if (day.minC === null || day.maxC === null) return null;
  const left = ((day.minC - lo) / span) * 100;
  const width = Math.max(4, ((day.maxC - day.minC) / span) * 100);
  return (
    <div className="range" aria-hidden="true">
      <span className="range__bar" style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} />
    </div>
  );
}
