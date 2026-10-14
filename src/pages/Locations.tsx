import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppState, MAX_PLACES } from '../state/AppState';
import { searchPlaces } from '../services/geocoding/search';
import { requestCurrentPlace, type GeoFailure } from '../services/geolocation';
import { useDebounced } from '../hooks/useOnline';
import { useLocalTitle } from '../hooks/useLocalTitle';
import { Notice } from '../components/ui/States';
import type { Place } from '../types/weather';
import { placeLabel } from '../components/weather/shared';

const GEO_MESSAGES: Record<GeoFailure, string> = {
  denied: 'Location access is off for this site. You can still search for a city below.',
  unavailable: 'Your device could not determine a position. Try again or search for a city.',
  timeout: 'Finding your location took too long. Try again or search for a city.',
  unsupported: 'This browser does not support location. Search for a city instead.',
};

export function LocationsPage() {
  const { places, activePlace, usingFallback, addPlace, removePlace, setActive, setPrimary, hasPlace } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const debounced = useDebounced(query, 320);
  useLocalTitle('Places');

  const search = useQuery({
    queryKey: ['geocode', debounced.trim().toLowerCase()],
    queryFn: ({ signal }) => searchPlaces(debounced, { signal }),
    enabled: debounced.trim().length >= 2,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  function choose(p: Place) {
    const ok = addPlace(p);
    if (!ok) {
      setAddMessage(`${MAX_PLACES} places are saved. Remove one to add ${p.name}.`);
      return;
    }
    setAddMessage(null);
    navigate('/');
  }

  async function useMyLocation() {
    setGeoBusy(true);
    setGeoMessage(null);
    const result = await requestCurrentPlace();
    setGeoBusy(false);
    if ('failure' in result) {
      setGeoMessage(GEO_MESSAGES[result.failure]);
      return;
    }
    choose(result.place);
  }

  const showResults = debounced.trim().length >= 2;

  return (
    <main id="main" className="page">
      <div className="page-head">
        <p className="eyebrow">Places</p>
        <h1 className="section-title">Where you are looking</h1>
        <p className="meta" style={{ maxWidth: '60ch' }}>
          Save up to {MAX_PLACES} places. They stay on this device. Nothing is sent except the search text and coordinates needed for the forecast.
        </p>
      </div>

      <div className="grid-two">
        <section className="stack" aria-labelledby="search-title">
          <h2 id="search-title" className="component-title">
            Add a place
          </h2>
          <div>
            <label htmlFor="place-search" className="meta" style={{ display: 'block', marginBottom: 8 }}>
              City name
            </label>
            <input
              id="place-search"
              className="field"
              type="search"
              autoComplete="off"
              placeholder="Search, e.g. Lisbon"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-describedby="search-help"
              aria-controls={showResults && search.data && search.data.length > 0 ? 'place-results' : undefined}
            />
            <p id="search-help" className="meta" style={{ marginTop: 8 }}>
              Type at least two letters. Cities with the same name show their region and country.
            </p>
          </div>

          <div aria-live="polite" id="place-results-status">
            {showResults && search.isFetching && <p className="meta">Searching…</p>}
            {showResults && search.isError && (
              <Notice title="Search is unavailable." tone="alert" action={<button type="button" className="btn btn--ghost" onClick={() => void search.refetch()}>Try again</button>}>
                We could not reach the place search. Your saved places are unaffected.
              </Notice>
            )}
            {showResults && search.data && search.data.length === 0 && !search.isFetching && (
              <Notice title="No places match that name.">Check the spelling, or try a larger city nearby.</Notice>
            )}
          </div>

          {showResults && search.data && search.data.length > 0 && (
            <ul className="result-list" id="place-results" aria-label="Search results">
              {search.data.map((p) => {
                const already = hasPlace(p.id);
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => choose(p)} aria-label={`${already ? 'Show' : 'Add'} ${placeLabel(p)}`}>
                      <span>
                        <span className="result-list__name" style={{ display: 'block' }}>{p.name}</span>
                        <span className="result-list__meta">{[p.region, p.country].filter(Boolean).join(', ')}</span>
                      </span>
                      <span className="meta">{already ? 'Saved' : 'Add'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {addMessage && <p className="meta" role="status">{addMessage}</p>}

          <div className="stack" style={{ gap: 10, paddingTop: 8 }}>
            <button type="button" className="btn btn--ghost" onClick={() => void useMyLocation()} disabled={geoBusy}>
              {geoBusy ? 'Finding you…' : 'Use my location'}
            </button>
            <p className="meta">Your location is requested only when you press this button. It is not stored, only used to fetch the forecast.</p>
            {geoMessage && <p role="alert" style={{ color: 'var(--accent-alert)' }}>{geoMessage}</p>}
          </div>
        </section>

        <section className="stack" aria-labelledby="saved-title">
          <h2 id="saved-title" className="component-title">
            Saved places
          </h2>
          {places.length === 0 ? (
            <Notice title="No saved places yet.">
              {`ATMOS is showing ${activePlace.name}. This is a default city, not your location. Search above to add your own.`}
            </Notice>
          ) : (
            <ul className="place-list">
              {places.map((p, i) => {
                const active = p.id === activePlace.id && !usingFallback;
                return (
                  <li key={p.id}>
                    <div>
                      <div className="place-list__name">{p.name}</div>
                      <div className="meta">
                        {[p.region, p.country].filter(Boolean).join(', ')}
                        {active ? ' · Showing' : ''}
                        {i === 0 ? ' · Primary' : ''}
                      </div>
                    </div>
                    <div className="place-list__actions">
                      <button type="button" className="btn btn--ghost" onClick={() => { setActive(p.id); navigate('/'); }} aria-label={`Show ${placeLabel(p)} today`}>
                        Show
                      </button>
                      {i !== 0 && (
                        <button type="button" className="btn btn--link" onClick={() => setPrimary(p.id)} aria-label={`Make ${p.name} primary`}>
                          Make primary
                        </button>
                      )}
                      <button type="button" className="btn btn--link" onClick={() => removePlace(p.id)} aria-label={`Remove ${placeLabel(p)}`}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
