import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useLocalTitle } from '../hooks/useLocalTitle';
import type { ThemePref, TimeFormat, PrecipUnit, TempUnit, WindUnit } from '../utils/units';
import pkg from '../../package.json';

function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="radio-group">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function SettingsPage() {
  const { prefs, setUnit, setTheme, resetAll } = useAppState();
  const { canPrompt, installed, prompt, isIOS } = useInstallPrompt();
  const [confirmClear, setConfirmClear] = useState(false);
  const [installNote, setInstallNote] = useState<string | null>(null);
  useLocalTitle('Settings');

  const u = prefs.units;

  async function onInstall() {
    const outcome = await prompt();
    if (outcome === 'unavailable') setInstallNote('Your browser has not offered installation right now. Use its menu to install ATMOS.');
    else setInstallNote(outcome === 'accepted' ? 'ATMOS is being installed.' : null);
  }

  return (
    <main id="main" className="page">
      <div className="page-head">
        <p className="eyebrow">Settings</p>
        <h1 className="section-title">Preferences</h1>
        <p className="meta">Saved on this device. They persist across reloads and the installed app.</p>
      </div>

      <div style={{ display: 'grid', gap: 0, maxWidth: 720 }}>
        <section className="settings-section">
          <Choice<TempUnit>
            legend="Temperature"
            name="temp"
            value={u.temp}
            onChange={(v) => setUnit('temp', v)}
            options={[
              { value: 'c', label: 'Celsius' },
              { value: 'f', label: 'Fahrenheit' },
            ]}
          />
          <Choice<WindUnit>
            legend="Wind"
            name="wind"
            value={u.wind}
            onChange={(v) => setUnit('wind', v)}
            options={[
              { value: 'kmh', label: 'km/h' },
              { value: 'mph', label: 'mph' },
            ]}
          />
          <Choice<PrecipUnit>
            legend="Precipitation"
            name="precip"
            value={u.precip}
            onChange={(v) => setUnit('precip', v)}
            options={[
              { value: 'mm', label: 'Millimetres' },
              { value: 'in', label: 'Inches' },
            ]}
          />
          <Choice<TimeFormat>
            legend="Time format"
            name="time"
            value={u.time}
            onChange={(v) => setUnit('time', v)}
            options={[
              { value: '12h', label: '12-hour' },
              { value: '24h', label: '24-hour' },
            ]}
          />
        </section>

        <section className="settings-section">
          <Choice<ThemePref>
            legend="Appearance"
            name="theme"
            value={prefs.theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
          <p className="meta">Dark is a separate palette, not an inversion of the light one.</p>
        </section>

        <section className="settings-section" aria-labelledby="install-title">
          <h2 id="install-title" className="component-title">
            Install
          </h2>
          {installed ? (
            <p className="meta">ATMOS is installed on this device.</p>
          ) : canPrompt ? (
            <div className="stack" style={{ gap: 12, justifyItems: 'start' }}>
              <button type="button" className="btn" onClick={() => void onInstall()}>
                Install ATMOS
              </button>
              {installNote && <p className="meta" role="status">{installNote}</p>}
            </div>
          ) : isIOS ? (
            <p className="meta">On iPhone or iPad, open the Share menu in Safari and choose Add to Home Screen.</p>
          ) : (
            <p className="meta">Your browser has not offered installation yet. Browsers that support it show an install option in their address bar or menu.</p>
          )}
        </section>

        <section className="settings-section about" aria-labelledby="about-title">
          <h2 id="about-title" className="component-title">
            About ATMOS
          </h2>
          <p className="meta" style={{ maxWidth: '60ch' }}>
            A weather publication disguised as an app. Forecasts are normalized from a public weather service. ATMOS does not add or adjust values.
          </p>
          <dl>
            <dt>Version</dt>
            <dd>{pkg.version}</dd>
            <dt>Weather data</dt>
            <dd>
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                Open-Meteo.com
              </a>{' '}
              (forecast, geocoding), licensed CC BY 4.0. The free service is for non-commercial use.
            </dd>
            <dt>Privacy</dt>
            <dd>No account, no analytics, no tracking. Saved places and settings are stored only in this browser.</dd>
          </dl>
        </section>

        <section className="settings-section" aria-labelledby="data-title">
          <h2 id="data-title" className="component-title">
            Local data
          </h2>
          <p className="meta" style={{ maxWidth: '60ch' }}>
            Clears saved places, settings and cached forecasts from this browser.
          </p>
          {confirmClear ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetAll();
                  setConfirmClear(false);
                }}
              >
                Confirm: clear everything
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--ghost" style={{ justifySelf: 'start' }} onClick={() => setConfirmClear(true)}>
              Clear local data
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
