import { daysBetween, type DayKey } from './dates';

export type Streak = { current: number; best: number; lastDay: DayKey | null };

export function recordActivity(s: Streak, today: DayKey): Streak {
  if (s.lastDay === today) return s;
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : Infinity;
  if (gap < 0) return s; // clock went backwards: never shrink or grow
  const current = gap === 1 ? s.current + 1 : 1;
  return { current, best: Math.max(s.best, current), lastDay: today };
}

/** The streak to show today: a streak whose last day is more than one day ago is already broken. */
export function displayStreak(s: Streak, today: DayKey): number {
  if (!s.lastDay) return 0;
  return daysBetween(s.lastDay, today) > 1 ? 0 : s.current;
}
