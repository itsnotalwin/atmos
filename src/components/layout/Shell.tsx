import { NavLink, Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppState } from '../../state/AppState';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { PwaUpdateBanner } from './PwaUpdateBanner';
import { useOnline } from '../../hooks/useOnline';
import { ErrorBoundary } from '../ui/States';

/** Sun-on-horizon glyph, the ATMOS mark. Matches public/icons. */
export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 14a8 8 0 0 1 16 0z" fill="var(--ink)" />
      <rect x="2" y="16.5" width="20" height="1.4" fill="var(--ink)" />
      <rect x="5" y="19.5" width="14" height="1.2" fill="var(--ink)" />
    </svg>
  );
}

const ITEMS = [
  { to: '/', label: 'Today', end: true, glyph: 'M4 14a8 8 0 0 1 16 0M2 18h20' },
  { to: '/forecast', label: 'Forecast', end: false, glyph: 'M3 7h18M3 12h18M3 17h12' },
  { to: '/locations', label: 'Places', end: false, glyph: 'M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { to: '/settings', label: 'Settings', end: false, glyph: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6' },
];

function Glyph({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" focusable="false">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shell() {
  const { activePlace, usingFallback, places } = useAppState();
  const { canPrompt, installed, prompt } = useInstallPrompt();
  const online = useOnline();

  // Keep the browser tab title in step with the active place.
  useEffect(() => {
    document.title = `ATMOS · ${activePlace.name}`;
  }, [activePlace.name]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="wordmark" aria-label="ATMOS, today">
            <Mark />
            ATMOS
          </Link>
          <nav className="primary-nav" aria-label="Primary">
            {ITEMS.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end}>
                {i.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!online && <span className="meta">Offline</span>}
            {canPrompt && !installed && (
              <button type="button" className="btn btn--ghost" onClick={() => void prompt()}>
                Install
              </button>
            )}
            <span className="meta" aria-label={`Showing ${activePlace.name}`} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usingFallback ? 'Default city' : activePlace.name}
            </span>
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>

      <nav className="bottom-nav" aria-label="Primary">
        {ITEMS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end}>
            <Glyph d={i.glyph} />
            {i.label}
          </NavLink>
        ))}
      </nav>

      <PwaUpdateBanner />
      {places.length === 0 && <span className="visually-hidden">No saved places yet.</span>}
    </>
  );
}
