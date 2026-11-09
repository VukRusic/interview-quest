import { addDays, dayKey, daysBetween } from '../../src/core/dates';

test('dayKey uses the local calendar date', () => {
  expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  expect(dayKey(new Date(2026, 10, 10, 0, 1))).toBe('2026-11-10');
});

test('addDays crosses a year boundary', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});

test('daysBetween counts calendar days across a DST change', () => {
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  expect(daysBetween('2026-11-10', '2026-11-08')).toBe(-2);
});
