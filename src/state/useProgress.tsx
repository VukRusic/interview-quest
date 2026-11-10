import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { dayKey, isDayKey, type DayKey } from '../core/dates';
import {
  importProgress,
  loadProgressDetailed,
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
  /** Set when stored progress could not be read and a raw copy was kept under this key. */
  recoveredBackupKey: string | null;
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
  const today = todayProp ?? currentDay();
  const [initial] = useState(() => loadProgressDetailed(storage, today));
  const [progress, dispatch] = useReducer(progressReducer, initial.progress);
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

  const recoveredBackupKey = initial.backupKey;
  const value = useMemo(
    () => ({ progress, dispatch, today, importJson, recoveredBackupKey }),
    [progress, today, importJson, recoveredBackupKey],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
