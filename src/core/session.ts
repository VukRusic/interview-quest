import { indexItems } from '../content/index';
import type { Lesson, Unit } from '../content/types';
import type { Progress } from '../state/progress';
import type { DayKey } from './dates';
import { dueQueue } from './srs';

/** `resolve` is an occasional re-solve of a full problem (Python or sandbox) that has come due. */
export type DailySession = { review: string[]; resolve?: string; lesson?: string; practice?: string; extras: string[] };

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

  // Open for today = not completed, or completed today (so the session stays stable after finishing).
  const openToday = (l: Lesson) => {
    const done = progress.completed[l.id];
    return !done || done === today;
  };
  const path = units.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));
  const firstOpen = (slot: Lesson['slot']) => path.find((p) => p.lesson.slot === slot && openToday(p.lesson));

  const lesson = firstOpen('lesson');
  const practice = firstOpen('practice');
  const currentUnit = lesson?.unit ?? path.find((p) => openToday(p.lesson))?.unit;
  const extras = currentUnit
    ? currentUnit.lessons.filter((l) => l.slot === 'extra' && openToday(l)).map((l) => l.id)
    : [];

  return { review, resolve, lesson: lesson?.lesson.id, practice: practice?.lesson.id, extras };
}
