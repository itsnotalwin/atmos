import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Place } from '../types/weather';
import { FALLBACK_PLACE, DEFAULT_PREFS, loadPlaces, loadPrefs, savePlaces, savePrefs, clearAllData, type StoredPrefs } from '../storage/local';
import type { ThemePref, UnitPrefs } from '../utils/units';

/**
 * App-wide state: saved places, active place, preferences.
 * Persistence is synchronous through localStorage on every change.
 */

interface AppState {
  places: Place[];
  activePlace: Place;
  /** True when no place has been chosen and the labeled fallback is in use. */
  usingFallback: boolean;
  prefs: StoredPrefs;
  units: UnitPrefs;
  addPlace: (p: Place) => boolean;
  removePlace: (id: string) => void;
  setActive: (id: string) => void;
  setPrimary: (id: string) => void;
  hasPlace: (id: string) => boolean;
  setUnit: <K extends keyof UnitPrefs>(key: K, value: UnitPrefs[K]) => void;
  setTheme: (t: ThemePref) => void;
  resetAll: () => void;
}

export const MAX_PLACES = 6;

const AppStateContext = createContext<AppState | null>(null);

function storage(): Storage {
  return window.localStorage;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(() => loadPlaces(storage()));
  const [prefs, setPrefs] = useState<StoredPrefs>(() => loadPrefs(storage()));

  useEffect(() => savePlaces(storage(), saved), [saved]);
  useEffect(() => savePrefs(storage(), prefs), [prefs]);

  const activePlace = saved.items.find((p) => p.id === saved.activeId) ?? FALLBACK_PLACE;
  const usingFallback = saved.items.length === 0;

  /** Returns false only when the list is full and the place is new. */
  const addPlace = useCallback(
    (p: Place) => {
      const exists = saved.items.some((x) => x.id === p.id);
      if (!exists && saved.items.length >= MAX_PLACES) return false;
      setSaved((s) => {
        if (s.items.some((x) => x.id === p.id)) return { ...s, activeId: p.id };
        return { items: [...s.items, p], activeId: p.id };
      });
      return true;
    },
    [saved.items],
  );

  const removePlace = useCallback((id: string) => {
    setSaved((s) => {
      const items = s.items.filter((p) => p.id !== id);
      const activeId = s.activeId === id ? (items[0]?.id ?? null) : s.activeId;
      return { items, activeId };
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setSaved((s) => (s.items.some((p) => p.id === id) ? { ...s, activeId: id } : s));
  }, []);

  const setPrimary = useCallback((id: string) => {
    setSaved((s) => {
      const target = s.items.find((p) => p.id === id);
      if (!target) return s;
      return { items: [target, ...s.items.filter((p) => p.id !== id)], activeId: id };
    });
  }, []);

  const hasPlace = useCallback((id: string) => saved.items.some((p) => p.id === id), [saved.items]);

  const setUnit = useCallback(<K extends keyof UnitPrefs>(key: K, value: UnitPrefs[K]) => {
    setPrefs((p) => ({ ...p, units: { ...p.units, [key]: value } }));
  }, []);

  const setTheme = useCallback((t: ThemePref) => setPrefs((p) => ({ ...p, theme: t })), []);

  const resetAll = useCallback(() => {
    clearAllData(storage());
    setSaved({ items: [], activeId: null });
    setPrefs(DEFAULT_PREFS);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      places: saved.items,
      activePlace,
      usingFallback,
      prefs,
      units: prefs.units,
      addPlace,
      removePlace,
      setActive,
      setPrimary,
      hasPlace,
      setUnit,
      setTheme,
      resetAll,
    }),
    [saved.items, activePlace, usingFallback, prefs, addPlace, removePlace, setActive, setPrimary, hasPlace, setUnit, setTheme, resetAll],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
