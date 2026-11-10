import { recordActivity, type Streak } from '../../src/core/streak';

const s0: Streak = { current: 0, best: 0, lastDay: null };

test('first activity starts a streak of 1', () => {
  expect(recordActivity(s0, '2026-11-10')).toEqual({ current: 1, best: 1, lastDay: '2026-11-10' });
});

test('same day leaves the streak unchanged', () => {
  const s: Streak = { current: 3, best: 5, lastDay: '2026-11-10' };
  expect(recordActivity(s, '2026-11-10')).toEqual(s);
});

test('next day increments', () => {
  expect(recordActivity({ current: 3, best: 3, lastDay: '2026-11-09' }, '2026-11-10')).toEqual({
    current: 4,
    best: 4,
    lastDay: '2026-11-10',
  });
});

test('a two-day gap resets to 1 and keeps best', () => {
  expect(recordActivity({ current: 6, best: 6, lastDay: '2026-11-07' }, '2026-11-10')).toEqual({
    current: 1,
    best: 6,
    lastDay: '2026-11-10',
  });
});

test('streak continues across month and DST boundaries', () => {
  expect(recordActivity({ current: 2, best: 2, lastDay: '2026-10-31' }, '2026-11-01').current).toBe(3);
  expect(recordActivity({ current: 2, best: 2, lastDay: '2026-03-28' }, '2026-03-29').current).toBe(3);
});

import { displayStreak } from '../../src/core/streak';

test('the displayed streak drops to 0 once a day has been missed, before any new activity', () => {
  const s: Streak = { current: 7, best: 7, lastDay: '2026-11-07' };
  expect(displayStreak(s, '2026-11-08')).toBe(7); // still alive: today not done yet
  expect(displayStreak(s, '2026-11-07')).toBe(7);
  expect(displayStreak(s, '2026-11-10')).toBe(0);
  expect(displayStreak({ current: 0, best: 0, lastDay: null }, '2026-11-10')).toBe(0);
});
