import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { dayKey, isDayKey, type DayKey } from '../core/dates';
import {
  importProgress,
  loadProgress,
  progressReducer,
  saveProgress,
  type Action,
  type ImportResult,
  type Progress,
} from './progress';

type Ctx = {
  progress: Progress;
  dispatch: (a: Action) => void;
  today: DayKey;
  /** Validates the JSON and replaces progress only when it is valid. */
  importJson: (json: string) => ImportResult;
};

const ProgressContext = createContext<Ctx | null>(null);

/** Today's local day. In dev builds only, `?today=YYYY-MM-DD` overrides it for testing. */
export function currentDay(): DayKey {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const fromSearch = new URLSearchParams(window.location.search).get('today');
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    const fromHash = new URLSearchParams(hashQuery).get('today');
    const override = fromSearch ?? fromHash;
    if (isDayKey(override)) return override;
  }
  return dayKey(new Date());
}

export function ProgressProvider({
  children,
  storage,
  today: todayProp,
}: {
  children: ReactNode;
  storage?: Storage;
  today?: DayKey;
}) {
  const [progress, dispatch] = useReducer(progressReducer, undefined, () => loadProgress(storage));
  const today = todayProp ?? currentDay();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveProgress(progress, storage);
  }, [progress, storage]);

  const importJson = useCallback((json: string) => {
    const r = importProgress(json);
    if (r.ok) dispatch({ type: 'replace', progress: r.progress });
    return r;
  }, []);

  const value = useMemo(() => ({ progress, dispatch, today, importJson }), [progress, today, importJson]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
