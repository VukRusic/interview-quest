import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  emptyProgress,
  exportProgress,
  importProgress,
  loadProgress,
  progressReducer,
  saveProgress,
  STORAGE_KEY,
  type Progress,
} from '../../src/state/progress';
import { ProgressProvider, useProgress } from '../../src/state/useProgress';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
} as unknown as Storage;

function sample(): Progress {
  let p = emptyProgress();
  p = progressReducer(p, { type: 'answer', itemId: 'q1', correct: true, today: '2026-11-10' });
  p = progressReducer(p, { type: 'selfGrade', itemId: 'm1', score: 0.5, today: '2026-11-10' });
  p = progressReducer(p, { type: 'completeLesson', lessonId: 'l1', today: '2026-11-10' });
  p = progressReducer(p, { type: 'saveStory', id: 's1', star: { situation: 'S "q"\n', task: 'T', action: 'A', result: 'R' } });
  p = progressReducer(p, { type: 'saveMockAnswer', id: 'm1', text: 'my answer' });
  return p;
}

test('corrupted JSON in storage loads fresh progress', () => {
  expect(loadProgress(fakeStorage({ [STORAGE_KEY]: '{not json' }))).toEqual(emptyProgress());
});

test('valid JSON with the wrong shape loads fresh progress', () => {
  expect(loadProgress(fakeStorage({ [STORAGE_KEY]: '{"version":1,"srs":5}' }))).toEqual(emptyProgress());
});

test('throwing storage: load returns empty, save does not throw', () => {
  expect(loadProgress(throwingStorage)).toEqual(emptyProgress());
  expect(() => saveProgress(sample(), throwingStorage)).not.toThrow();
});

test('save then load round-trips', () => {
  const s = fakeStorage();
  saveProgress(sample(), s);
  expect(loadProgress(s)).toEqual(sample());
});

test('export → import round trip gives an equal object', () => {
  const r = importProgress(exportProgress(sample()));
  expect(r).toEqual({ ok: true, progress: sample() });
});

test('importing a wrong version fails with an error', () => {
  const r = importProgress('{"version":2}');
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toMatch(/\S/);
  expect(importProgress('not json').ok).toBe(false);
});

test('answer records srs and bumps the streak', () => {
  const p = progressReducer(emptyProgress(), { type: 'answer', itemId: 'q1', correct: true, today: '2026-11-10' });
  expect(p.srs.q1).toEqual({ id: 'q1', box: 0, due: '2026-11-11', lastAnswered: '2026-11-10' });
  expect(p.streak).toEqual({ current: 1, best: 1, lastDay: '2026-11-10' });
});

test('selfGrade is clamped to 0..1', () => {
  const p = progressReducer(emptyProgress(), { type: 'selfGrade', itemId: 'm', score: 3, today: '2026-11-10' });
  expect(p.selfGrades.m).toBe(1);
});

test('a failed import through the store leaves progress untouched', () => {
  const s = fakeStorage();
  saveProgress(sample(), s);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProgressProvider storage={s} today="2026-11-10">
      {children}
    </ProgressProvider>
  );
  const { result } = renderHook(() => useProgress(), { wrapper });
  let outcome: ReturnType<typeof result.current.importJson> | undefined;
  act(() => {
    outcome = result.current.importJson('{"version":2}');
  });
  expect(outcome?.ok).toBe(false);
  expect(result.current.progress).toEqual(sample());
  expect(loadProgress(s)).toEqual(sample());
});

test('the store saves on every change', () => {
  const s = fakeStorage();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProgressProvider storage={s} today="2026-11-10">
      {children}
    </ProgressProvider>
  );
  const { result } = renderHook(() => useProgress(), { wrapper });
  act(() => result.current.dispatch({ type: 'answer', itemId: 'q9', correct: false, today: result.current.today }));
  expect(loadProgress(s).srs.q9?.box).toBe(0);
});

describe('rejected stored progress is never silently destroyed', () => {
  const T = '2026-11-10';
  const story = { situation: 'S', task: 'T', action: 'A', result: 'R' };

  test('a schema failure backs up the raw data and salvages valid stories', async () => {
    const { loadProgressDetailed } = await import('../../src/state/progress');
    const raw = JSON.stringify({ ...emptyProgress(), selfGrades: { x: 1.2 }, stories: { s1: story } });
    const s = fakeStorage({ [STORAGE_KEY]: raw });
    const r = loadProgressDetailed(s, T);
    expect(r.backupKey).toMatch(/^iq\.progress\.backup\./);
    expect(s.getItem(r.backupKey!)).toBe(raw);
    expect(r.progress.stories).toEqual({ s1: story });
    expect(r.progress.selfGrades).toEqual({});
  });

  test('a newer version is backed up, not overwritten', async () => {
    const { loadProgressDetailed } = await import('../../src/state/progress');
    const raw = JSON.stringify({ version: 2, stories: { s1: story } });
    const s = fakeStorage({ [STORAGE_KEY]: raw });
    const r = loadProgressDetailed(s, T);
    expect(s.getItem(r.backupKey!)).toBe(raw);
  });

  test('valid or empty storage makes no backup', async () => {
    const { loadProgressDetailed } = await import('../../src/state/progress');
    const s = fakeStorage();
    expect(loadProgressDetailed(s, T).backupKey).toBeNull();
    saveProgress(sample(), s);
    expect(loadProgressDetailed(s, T).backupKey).toBeNull();
  });

  test('the store keeps salvaged stories after its first save and tells the user', async () => {
    const raw = JSON.stringify({ ...emptyProgress(), streak: 'bad', stories: { s1: story } });
    const s = fakeStorage({ [STORAGE_KEY]: raw });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ProgressProvider storage={s} today={T}>
        {children}
      </ProgressProvider>
    );
    const { result } = renderHook(() => useProgress(), { wrapper });
    expect(result.current.recoveredBackupKey).toMatch(/^iq\.progress\.backup\./);
    act(() => result.current.dispatch({ type: 'answer', itemId: 'q', correct: true, today: T }));
    expect(loadProgress(s).stories).toEqual({ s1: story });
  });
});
