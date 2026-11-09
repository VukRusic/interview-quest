import { addDays, type DayKey } from './dates';

export const INTERVALS = [1, 3, 7, 14, 30] as const;

export type Box = 0 | 1 | 2 | 3 | 4;
export type SrsItem = { id: string; box: Box; due: DayKey; lastAnswered: DayKey };

function place(id: string, box: Box, today: DayKey): SrsItem {
  return { id, box, due: addDays(today, INTERVALS[box]), lastAnswered: today };
}

/**
 * Leitner review. First answer → box 0. Correct on/after due → up one box.
 * Correct before due (incl. a second answer the same day) → only lastAnswered changes.
 * A miss always resets to box 0.
 */
export function review(prev: SrsItem | undefined, id: string, correct: boolean, today: DayKey): SrsItem {
  if (!prev) return place(id, 0, today);
  if (!correct) return place(id, 0, today);
  if (today < prev.due) return { ...prev, lastAnswered: today };
  return place(id, Math.min(prev.box + 1, 4) as Box, today);
}

export function isDue(item: SrsItem, today: DayKey): boolean {
  return item.due <= today;
}

/** Learned = reached box 4, which only happens by passing the 14-day (box 3) review. */
export function isLearned(item: SrsItem): boolean {
  return item.box === 4;
}

export function dueQueue(items: SrsItem[], today: DayKey, cap = 15): SrsItem[] {
  return items
    .filter((i) => isDue(i, today))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.id.localeCompare(b.id)))
    .slice(0, cap);
}
