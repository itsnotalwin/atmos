import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Update flow (registerType: 'prompt'). A new service worker waits. The user
 * is offered a refresh; nothing reloads without their action, so unsaved
 * state is never discarded silently.
 */
export function PwaUpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [update, setUpdate] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    const fn = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setUpdate(() => fn);
  }, []);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="banner" role="status">
      <span>{needRefresh ? 'A new version of ATMOS is ready.' : 'ATMOS is ready to work offline.'}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {needRefresh && (
          <button type="button" className="btn" onClick={() => void update?.(true)}>
            Update
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost"
          style={{ borderColor: 'currentColor', color: 'inherit' }}
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
