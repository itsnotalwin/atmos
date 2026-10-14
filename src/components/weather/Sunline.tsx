import { useEffect, useState } from 'react';
import type { TimeFormat } from '../../utils/units';
import { formatClock, parseWallClock, minutesBetween, daylightProgress } from '../../utils/time';

/**
 * Minimal solar line: a horizon arc with the sun marker placed by daylight
 * progress. Times are provider-local wall-clock strings, so the marker reflects
 * the location's own time, not the device's.
 */
export function Sunline({
  sunrise,
  sunset,
  now,
  format,
  durationLabel,
}: {
  sunrise: string | null;
  sunset: string | null;
  now: string;
  format: TimeFormat;
  durationLabel: string;
}) {
  const [, force] = useState(0);
  // Re-render once a minute so the marker tracks time while the page is open.
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const progress = sunrise && sunset ? daylightProgress(now, sunrise, sunset) : null;
  const angle = progress === null ? null : Math.PI * (1 - progress);
  const cx = 160, cy = 150, r = 130;
  const dot = angle === null ? null : { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };

  let state = 'Sun times unavailable';
  if (sunrise && sunset) {
    const beforeRise = (minutesBetween(sunrise, now) ?? 0) < 0;
    state = progress !== null ? 'Daylight now' : beforeRise ? 'Before sunrise' : 'After sunset';
  }

  return (
    <div className="sun" aria-label={`Sunrise ${sunrise ? formatClock(sunrise, format) : 'unavailable'}, sunset ${sunset ? formatClock(sunset, format) : 'unavailable'}, daylight ${durationLabel}`}>
      <svg viewBox="0 0 320 170" width="100%" style={{ maxWidth: 360 }} aria-hidden="true" focusable="false">
        <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 5" />
        <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="var(--ink)" strokeWidth="1" opacity={progress === null ? 0.15 : 0.6} />
        <line x1="10" x2="310" y1={cy} y2={cy} stroke="var(--ink)" strokeWidth="1" />
        {dot && <circle cx={dot.x} cy={dot.y} r="7" fill="var(--ink)" />}
        {dot && <circle cx={dot.x} cy={dot.y} r="15" fill="none" stroke="var(--ink)" strokeWidth="1" opacity="0.25" />}
      </svg>
      <div className="sun__times">
        <div>
          <span className="meta">Sunrise</span>
          <strong>{sunrise ? formatClock(sunrise, format) : '–'}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="meta">Daylight</span>
          <strong style={{ fontSize: 26 }}>{durationLabel}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="meta">Sunset</span>
          <strong>{sunset ? formatClock(sunset, format) : '–'}</strong>
        </div>
      </div>
      <p className="meta">{state}</p>
      {parseWallClock(now) === null && <p className="meta">Local time unavailable.</p>}
    </div>
  );
}
