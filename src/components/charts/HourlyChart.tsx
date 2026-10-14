import { useRef, useState, type KeyboardEvent } from 'react';
import type { HourlyPoint } from '../../types/weather';
import { formatHourLabel, hourKey } from '../../utils/time';
import { formatPrecip, formatTemp, formatPercent, formatWind, formatUv, type UnitPrefs } from '../../utils/units';

/**
 * Editorial hourly chart. The line is SVG (decorative); each hour is a real
 * focusable button with its own text, so no information lives only in hover.
 * Arrow keys move between hours. A table alternative sits beneath.
 */

const COL_W = 56;
const CHART_H = 150;
const PAD_TOP = 22;
const PAD_BOTTOM = 14;

export interface HourlyChartProps {
  points: HourlyPoint[];
  units: UnitPrefs;
  nowKey: string | null;
  label: string;
  title?: string;
}

export function HourlyChart({ points, units, nowKey, label, title = "Next 24 hours" }: HourlyChartProps) {
  const [selected, setSelected] = useState(() => {
    const idx = nowKey ? points.findIndex((p) => hourKey(p.time) === nowKey) : -1;
    return idx >= 0 ? idx : 0;
  });
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const n = points.length;
  if (n === 0) return null;

  const temps = points.map((p) => p.temperatureC).filter((t): t is number => t !== null);
  const min = temps.length ? Math.min(...temps) : 0;
  const max = temps.length ? Math.max(...temps) : 1;
  const span = Math.max(max - min, 1);
  const width = n * COL_W;
  const yFor = (t: number) => PAD_TOP + (1 - (t - min) / span) * (CHART_H - PAD_TOP - PAD_BOTTOM);
  const xFor = (i: number) => i * COL_W + COL_W / 2;

  const pathPoints = points.map((p, i) => (p.temperatureC === null ? null : { x: xFor(i), y: yFor(p.temperatureC) }));
  const segs = pathPoints.filter((p): p is { x: number; y: number } => p !== null);
  let d = '';
  segs.forEach((p, i) => {
    if (i === 0) {
      d += `M${p.x},${p.y}`;
    } else {
      const prev = segs[i - 1]!;
      const cx = (prev.x + p.x) / 2;
      d += ` C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }
  });
  const area = segs.length ? `${d} L${segs[segs.length - 1]!.x},${CHART_H} L${segs[0]!.x},${CHART_H} Z` : '';

  const nowIdx = nowKey ? points.findIndex((p) => hourKey(p.time) === nowKey) : -1;
  const sel = points[selected]!;

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = i;
    if (e.key === 'ArrowRight') next = Math.min(n - 1, i + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, i - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    setSelected(next);
    btnRefs.current[next]?.focus();
    btnRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  const maxRain = Math.max(100, ...points.map((p) => p.precipitationProbabilityPercent ?? 0));

  return (
    <section className="hourly" aria-labelledby="hourly-title">
      <div className="page-head__row">
        <h2 id="hourly-title" className="component-title">
          {title}
        </h2>
        <p className="meta">Use arrow keys or swipe to move between hours.</p>
      </div>

      <div className="hourly__scroller" role="region" aria-label={`${label}, hourly, scrollable`} tabIndex={-1}>
        <div className="hourly__track" style={{ ['--cols' as string]: n, ['--col-w' as string]: `${COL_W}px` }}>
          <svg className="hourly__svg" viewBox={`0 0 ${width} ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {area && <path d={area} fill="var(--soft)" opacity="0.55" />}
            {d && <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
            {nowIdx >= 0 && (
              <line x1={xFor(nowIdx)} x2={xFor(nowIdx)} y1={0} y2={CHART_H} stroke="var(--ink)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          <ul className="hourly__cols" aria-label="Hourly values">
            {points.map((p, i) => {
              const isNow = i === nowIdx;
              const y = p.temperatureC === null ? null : yFor(p.temperatureC);
              return (
                <li key={p.time} className="hourly__col">
                  {y !== null && (
                    <span
                      className={`hourly__point ${i === selected ? 'hourly__point--selected' : ''}`}
                      style={{ left: '50%', top: y }}
                      aria-hidden="true"
                    />
                  )}
                  <button
                    ref={(el) => {
                      btnRefs.current[i] = el;
                    }}
                    type="button"
                    className="hourly__btn"
                    aria-pressed={i === selected}
                    aria-label={`${formatHourLabel(p.time, units.time)}${isNow ? ', now' : ''}, ${formatTemp(p.temperatureC, units.temp)}, ${p.condition.label}, rain chance ${formatPercent(p.precipitationProbabilityPercent)}`}
                    onClick={() => setSelected(i)}
                    onFocus={() => setSelected(i)}
                    onMouseEnter={() => setSelected(i)}
                    onKeyDown={(e) => onKey(e, i)}
                  >
                    <span aria-hidden="true" />
                    <span className={`hourly__hour ${isNow ? 'hourly__hour--now' : ''}`} aria-hidden="true">
                      {isNow ? 'Now' : formatHourLabel(p.time, units.time)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hourly__rain" aria-hidden="true">
            {points.map((p, i) => {
              const v = p.precipitationProbabilityPercent ?? 0;
              return (
                <span
                  key={p.time}
                  className="hourly__rain-bar"
                  style={{ left: xFor(i), height: `${Math.max(2, (v / maxRain) * 34)}px`, opacity: v >= 60 ? 1 : 0.6 }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <dl className="hourly__detail" aria-live="polite">
        <div>
          <dt>Time</dt>
          <dd>{formatHourLabel(sel.time, units.time)}</dd>
        </div>
        <div>
          <dt>Temperature</dt>
          <dd>{formatTemp(sel.temperatureC, units.temp)}</dd>
        </div>
        <div>
          <dt>Feels like</dt>
          <dd>{formatTemp(sel.feelsLikeC, units.temp)}</dd>
        </div>
        <div>
          <dt>Rain chance</dt>
          <dd>{formatPercent(sel.precipitationProbabilityPercent)}</dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>{formatPrecip(sel.precipitationMm, units.precip)}</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{formatWind(sel.windSpeedKmh, units.wind)}</dd>
        </div>
        <div>
          <dt>UV index</dt>
          <dd>{formatUv(sel.uvIndex)}</dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd style={{ fontSize: 18 }}>{sel.condition.label}</dd>
        </div>
      </dl>

      <details>
        <summary className="btn--link" style={{ cursor: 'pointer' }}>
          View hourly values as a table
        </summary>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <caption className="visually-hidden">Hourly forecast for {label}</caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: 8 }}>Hour</th>
                <th scope="col" style={{ textAlign: 'right', padding: 8 }}>Temp</th>
                <th scope="col" style={{ textAlign: 'right', padding: 8 }}>Rain chance</th>
                <th scope="col" style={{ textAlign: 'left', padding: 8 }}>Conditions</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} style={{ borderTop: '1px solid var(--border)' }}>
                  <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: 400 }}>{formatHourLabel(p.time, units.time)}</th>
                  <td style={{ textAlign: 'right', padding: 8 }}>{formatTemp(p.temperatureC, units.temp)}</td>
                  <td style={{ textAlign: 'right', padding: 8 }}>{formatPercent(p.precipitationProbabilityPercent)}</td>
                  <td style={{ padding: 8 }}>{p.condition.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
