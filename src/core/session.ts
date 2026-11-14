import { indexItems } from '../content/index';
import type { Unit } from '../content/types';
import type { Progress } from '../state/progress';
import type { DayKey } from './dates';
import { dueQueue } from './srs';

/** How many lessons can be finished for the first time in one day. Reviews and replays are never limited. */
export const DAILY_NEW_LESSONS = 2;

/**
 * `resolve` is an occasional re-solve of a full problem (Python or sandbox) that has come due.
 * `lessons` are today's: the ones first finished today plus the next not-yet-finished ones, in trail
 * order, up to the daily allowance. `held` = the allowance is used and more lessons are waiting.
 */
export type DailySession = { review: string[]; resolve?: string; lessons: string[]; held: boolean; allDone: boolean };
export type LessonAccess = 'done' | 'today' | 'tomorrow' | 'later';

const REVIEW_CAP = 15;

export function buildSession(units: Unit[], progress: Progress, today: DayKey): DailySession {
  const items = indexItems(units);
  const reviewable = Object.values(progress.srs).filter((s) => {
    const kind = items.get(s.id)?.step.kind;
    return kind === 'quiz' || kind === 'bug';
  });
  const review = dueQueue(reviewable, today, REVIEW_CAP).map((s) => s.id);

  // Full problems don't go in the quick review; the most overdue one comes back as a re-solve.
  // One re-solved today stays (box > 0 means it was a later answer, not today's first attempt).
  const problems = Object.values(progress.srs).filter((s) => {
    const kind = items.get(s.id)?.step.kind;
    return kind === 'python' || kind === 'sandbox';
  });
  const resolve =
    problems.find((s) => s.lastAnswered === today && s.box > 0)?.id ?? dueQueue(problems, today, 1)[0]?.id;

  const path = units.flatMap((u) => u.lessons.map((l) => l.id));
  const doneToday = path.filter((id) => progress.completed[id] === today);
  const waiting = path.filter((id) => !progress.completed[id]);
  const fresh = new Set(waiting.slice(0, Math.max(0, DAILY_NEW_LESSONS - doneToday.length)));
  const lessons = path.filter((id) => progress.completed[id] === today || fresh.has(id));

  return {
    review,
    resolve,
    lessons,
    held: doneToday.length >= DAILY_NEW_LESSONS && waiting.length > 0,
    allDone: waiting.length === 0,
  };
}

/** Whether a lesson can be opened now. Finished lessons always can. */
export function lessonAccess(session: DailySession, progress: Progress, lessonId: string): LessonAccess {
  if (progress.completed[lessonId]) return 'done';
  if (session.lessons.includes(lessonId)) return 'today';
  return session.held ? 'tomorrow' : 'later';
}
