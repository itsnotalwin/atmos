import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../state/AppState';
import { Shell } from '../components/layout/Shell';
import { TodayPage } from '../pages/Today';
import { ForecastPage } from '../pages/Forecast';
import { DayDetailPage } from '../pages/DayDetail';
import { LocationsPage } from '../pages/Locations';
import { SettingsPage } from '../pages/Settings';
import { NotFoundPage } from '../pages/NotFound';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

/** Applies the theme preference to <html data-theme>. System follows the OS. */
function ThemeSync() {
  const { prefs } = useAppState();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark =
        prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset['theme'] = dark ? 'dark' : 'light';
    };
    apply();
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [prefs.theme]);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <ThemeSync />
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<TodayPage />} />
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="forecast/:date" element={<DayDetailPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </QueryClientProvider>
  );
}
