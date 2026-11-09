import { z } from 'zod';
import { isDayKey, type DayKey } from '../core/dates';
import { review, type SrsItem } from '../core/srs';
import { recordActivity, type Streak } from '../core/streak';

export const STORAGE_KEY = 'iq.progress.v1';

export type Star = { situation: string; task: string; action: string; result: string };

export type Progress = {
  version: 1;
  srs: Record<string, SrsItem>;
  selfGrades: Record<string, number>;
  completed: Record<string, DayKey>;
  streak: Streak;
  stories: Record<string, Star>;
  mockAnswers: Record<string, string>;
};

const DayKeySchema = z.string().refine(isDayKey, 'expected a YYYY-MM-DD date');

const SrsItemSchema = z.object({
  id: z.string(),
  box: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  due: DayKeySchema,
  lastAnswered: DayKeySchema,
});

const StarSchema = z.object({ situation: z.string(), task: z.string(), action: z.string(), result: z.string() });

export const ProgressSchema = z.object({
  version: z.literal(1),
  srs: z.record(z.string(), SrsItemSchema),
  selfGrades: z.record(z.string(), z.number().min(0).max(1)),
  completed: z.record(z.string(), DayKeySchema),
  streak: z.object({
    current: z.number().int().min(0),
    best: z.number().int().min(0),
    lastDay: DayKeySchema.nullable(),
  }),
  stories: z.record(z.string(), StarSchema),
  mockAnswers: z.record(z.string(), z.string()),
});

export function emptyProgress(): Progress {
  return {
    version: 1,
    srs: {},
    selfGrades: {},
    completed: {},
    streak: { current: 0, best: 0, lastDay: null },
    stories: {},
    mockAnswers: {},
  };
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function loadProgress(storage: Storage | undefined = defaultStorage()): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = ProgressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Progress) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress, storage: Storage | undefined = defaultStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked: the app keeps working in memory */
  }
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2);
}

export type ImportResult = { ok: true; progress: Progress } | { ok: false; error: string };

export function importProgress(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'This file is not valid JSON. Choose a file exported from Interview Quest.' };
  }
  const parsed = ProgressSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` at "${first.path.join('.')}"` : '';
    return {
      ok: false,
      error: `This file doesn't look like Interview Quest progress${where}: ${first?.message ?? 'unknown problem'}.`,
    };
  }
  return { ok: true, progress: parsed.data as Progress };
}

export type Action =
  | { type: 'answer'; itemId: string; correct: boolean; today: DayKey }
  | { type: 'selfGrade'; itemId: string; score: number; today: DayKey }
  | { type: 'completeLesson'; lessonId: string; today: DayKey }
  | { type: 'saveStory'; id: string; star: Star }
  | { type: 'saveMockAnswer'; id: string; text: string }
  | { type: 'replace'; progress: Progress };

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function progressReducer(p: Progress, a: Action): Progress {
  switch (a.type) {
    case 'answer':
      return {
        ...p,
        srs: { ...p.srs, [a.itemId]: review(p.srs[a.itemId], a.itemId, a.correct, a.today) },
        streak: recordActivity(p.streak, a.today),
      };
    case 'selfGrade':
      return {
        ...p,
        selfGrades: { ...p.selfGrades, [a.itemId]: clamp01(a.score) },
        streak: recordActivity(p.streak, a.today),
      };
    case 'completeLesson':
      return {
        ...p,
        completed: { ...p.completed, [a.lessonId]: p.completed[a.lessonId] ?? a.today },
        streak: recordActivity(p.streak, a.today),
      };
    case 'saveStory':
      return { ...p, stories: { ...p.stories, [a.id]: a.star } };
    case 'saveMockAnswer':
      return { ...p, mockAnswers: { ...p.mockAnswers, [a.id]: a.text } };
    case 'replace':
      return a.progress;
  }
}
