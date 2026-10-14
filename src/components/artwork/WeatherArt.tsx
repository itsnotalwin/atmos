import type { ConditionKind } from '../../types/weather';

/**
 * ATMOS signature artwork. Each condition is a composition built from the same
 * geometric vocabulary: disks, horizon bars, diagonal hatching, halftone dots.
 * SVG only, no raster or external assets. Decorative: aria-hidden.
 * Adding a condition: add a case in `Composition` and a row in the design doc.
 */

interface ArtProps {
  kind: ConditionKind;
  isDay: boolean;
  className?: string;
}

const INK = 'var(--black)';
const SOFT = 'var(--soft)';
const PALE = 'var(--pale)';
const PAPER = 'var(--paper)';
const MUTED = 'var(--muted)';

function Halftone({ id }: { id: string }) {
  return (
    <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="7" cy="7" r="1.6" fill={MUTED} opacity="0.5" />
    </pattern>
  );
}

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <line x1="0" y1="0" x2="0" y2="18" stroke={INK} strokeWidth="1" opacity="0.35" />
    </pattern>
  );
}

function Cloud({ x, y, s = 1, fill = PALE }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-120" y="0" width="240" height="60" rx="30" fill={fill} />
      <circle cx="-30" cy="6" r="44" fill={fill} />
      <circle cx="40" cy="-6" r="56" fill={fill} />
    </g>
  );
}

function Rain({ count, slow = false }: { count: number; slow?: boolean }) {
  const lines = Array.from({ length: count }, (_, i) => {
    const x = 60 + ((i * 97) % 300);
    const delay = (i * 0.37) % 3;
    return (
      <line
        key={i}
        x1={x}
        y1={0}
        x2={x - 18}
        y2={34}
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
        className={slow ? 'art-fall art-fall--slow' : 'art-fall'}
        style={{ animationDelay: `${delay}s` }}
      />
    );
  });
  return <g>{lines}</g>;
}

function Snow({ count }: { count: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = 50 + ((i * 131) % 320);
        const r = i % 3 === 0 ? 2.6 : 1.6;
        return (
          <circle
            key={i}
            cx={x}
            cy={0}
            r={r}
            fill={INK}
            className="art-fall art-fall--slow"
            style={{ animationDelay: `${(i * 0.53) % 6}s` }}
          />
        );
      })}
    </g>
  );
}

function Composition({ kind, isDay }: { kind: ConditionKind; isDay: boolean }) {
  switch (kind) {
    case 'clear':
      if (!isDay) {
        return (
          <g>
            <rect width="400" height="400" fill={INK} />
            <circle cx="262" cy="150" r="96" fill={PAPER} opacity="0.08" />
            <circle cx="236" cy="150" r="92" fill={PALE} />
            <circle cx="262" cy="130" r="84" fill={INK} />
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={40 + ((i * 53) % 320)} cy={40 + ((i * 97) % 200)} r="1.2" fill={PAPER} opacity={0.5} />
            ))}
            <rect x="0" y="300" width="400" height="2" fill={PALE} opacity="0.4" />
          </g>
        );
      }
      return (
        <g className="art-drift">
          <defs>
            <Halftone id="dots-sun" />
          </defs>
          <rect width="400" height="400" fill={PAPER} />
          <circle cx="200" cy="200" r="150" fill={SOFT} />
          <rect width="400" height="400" fill="url(#dots-sun)" opacity="0.6" />
          <circle cx="200" cy="200" r="92" fill={PALE} />
          <rect x="0" y="232" width="400" height="6" fill={INK} />
          <rect x="250" y="0" width="10" height="400" fill={INK} opacity="0.9" />
          <rect x="0" y="92" width="120" height="3" fill={INK} />
        </g>
      );
    case 'partly-cloudy':
      return (
        <g className="art-drift">
          <rect width="400" height="400" fill={PAPER} />
          <circle cx="270" cy="120" r="76" fill={SOFT} />
          <circle cx="292" cy="98" r="22" fill={INK} />
          <Cloud x={160} y={230} s={1} fill={PALE} />
          <Cloud x={230} y={270} s={0.7} fill={SOFT} />
          <rect x="0" y="332" width="400" height="1" fill={INK} opacity="0.2" />
        </g>
      );
    case 'overcast':
      return (
        <g>
          <defs>
            <Halftone id="dots-over" />
          </defs>
          <rect width="400" height="400" fill={PALE} />
          <circle cx="150" cy="180" r="150" fill={SOFT} opacity="0.9" />
          <circle cx="260" cy="210" r="130" fill="url(#dots-over)" opacity="0.8" />
          <rect x="0" y="300" width="400" height="90" fill={SOFT} />
          <rect x="0" y="0" width="400" height="400" fill="url(#dots-over)" opacity="0.25" />
        </g>
      );
    case 'fog':
      return (
        <g>
          <rect width="400" height="400" fill={PALE} />
          {[120, 160, 200, 240, 280].map((y, i) => (
            <rect key={y} x={i % 2 ? 40 : 0} y={y} width={i % 2 ? 320 : 380} height="10" rx="5" fill={MUTED} opacity={0.25 + i * 0.08} />
          ))}
        </g>
      );
    case 'drizzle':
    case 'rain':
    case 'freezing-rain':
      return (
        <g>
          <defs>
            <Hatch id="hatch-rain" />
          </defs>
          <rect width="400" height="400" fill={PAPER} />
          <rect width="400" height="400" fill="url(#hatch-rain)" />
          <Cloud x={200} y={110} s={1.05} fill={SOFT} />
          <Cloud x={130} y={150} s={0.6} fill={PALE} />
          <g transform="translate(0 170)">
            <Rain count={kindCount(kind)} slow={kind === 'drizzle'} />
          </g>
        </g>
      );
    case 'thunderstorm':
      return (
        <g>
          <rect width="400" height="400" fill={PAPER} />
          <polygon points="0,0 220,0 130,400 0,400" fill={INK} />
          <rect x="230" y="0" width="170" height="130" fill={SOFT} />
          <Cloud x={230} y={120} s={0.9} fill={PALE} />
          <polyline
            points="250,200 205,262 240,262 190,350"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
            className="art-flash"
          />
        </g>
      );
    case 'snow':
      return (
        <g>
          <rect width="400" height="400" fill={PAPER} />
          <circle cx="200" cy="200" r="120" fill={PALE} />
          <Snow count={26} />
          <rect x="0" y="300" width="400" height="2" fill={INK} opacity="0.2" />
        </g>
      );
    case 'unknown':
    default:
      return (
        <g>
          <rect width="400" height="400" fill={PALE} />
          <circle cx="200" cy="200" r="110" fill="none" stroke={MUTED} strokeWidth="1" strokeDasharray="3 6" />
        </g>
      );
  }
}

function kindCount(kind: ConditionKind): number {
  return kind === 'drizzle' ? 16 : 30;
}

export function WeatherArt({ kind, isDay, className }: ArtProps) {
  // Keying on kind and day restarts the enter animation on every change.
  return (
    <div className={`artwork ${className ?? ''}`} aria-hidden="true">
      <svg
        key={`${kind}-${isDay ? 'd' : 'n'}`}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="artwork__enter"
        role="img"
        focusable="false"
      >
        <Composition kind={kind} isDay={isDay} />
      </svg>
    </div>
  );
}
