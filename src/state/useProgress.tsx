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
import { requestPersistentStorage } from './backup';

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
  const [liveDay, setLiveDay] = useState(currentDay);
  const today = todayProp ?? liveDay;

  // The app may stay open across midnight (an installed PWA in the background), so re-check the
  // day on a timer and whenever the tab becomes visible or focused again.
  useEffect(() => {
    if (todayProp) return;
    const refresh = () => setLiveDay(currentDay());
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [todayProp]);

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

  // Once there is real progress, ask the browser to keep storage around (silent in Safari/Chrome).
  const asked = useRef(false);
  const hasCompleted = Object.keys(progress.completed).length > 0;
  useEffect(() => {
    if (hasCompleted && !asked.current) {
      asked.current = true;
      void requestPersistentStorage();
    }
  }, [hasCompleted]);

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
