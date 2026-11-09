import { dueQueue, isDue, isLearned, review, type SrsItem } from '../../src/core/srs';
import { addDays } from '../../src/core/dates';

const T = '2026-11-10';

test('first correct answer puts the item in box 0, due tomorrow', () => {
  expect(review(undefined, 'a', true, T)).toEqual({ id: 'a', box: 0, due: '2026-11-11', lastAnswered: T });
});

test('first wrong answer also starts at box 0', () => {
  expect(review(undefined, 'a', false, T)).toMatchObject({ box: 0, due: '2026-11-11' });
});

test('correct answers on due dates climb 1 → 3 → 7 → 14 → 30 days', () => {
  let item = review(undefined, 'a', true, T);
  const expected: [number, number][] = [
    [1, 3],
    [2, 7],
    [3, 14],
    [4, 30],
  ];
  for (const [box, gap] of expected) {
    const day = item.due;
    if (box === 4) expect(isLearned(item)).toBe(false);
    item = review(item, 'a', true, day);
    expect(item.box).toBe(box);
    expect(item.due).toBe(addDays(day, gap));
  }
  expect(isLearned(item)).toBe(true);
});

test('a miss at box 3 resets to box 0, due tomorrow', () => {
  const item: SrsItem = { id: 'a', box: 3, due: T, lastAnswered: '2026-10-27' };
  expect(review(item, 'a', false, T)).toEqual({ id: 'a', box: 0, due: '2026-11-11', lastAnswered: T });
});

test('two correct answers on the same day advance only once', () => {
  const start: SrsItem = { id: 'a', box: 1, due: T, lastAnswered: '2026-11-07' };
  const once = review(start, 'a', true, T);
  const twice = review(once, 'a', true, T);
  expect(once.box).toBe(2);
  expect(twice).toEqual(once);
});

test('a correct answer before due leaves box and due unchanged', () => {
  const item: SrsItem = { id: 'a', box: 2, due: '2026-11-15', lastAnswered: '2026-11-08' };
  expect(review(item, 'a', true, T)).toEqual({ ...item, lastAnswered: T });
});

test('isDue is true on and after the due day', () => {
  const item: SrsItem = { id: 'a', box: 0, due: T, lastAnswered: '2026-11-09' };
  expect(isDue(item, '2026-11-09')).toBe(false);
  expect(isDue(item, T)).toBe(true);
  expect(isDue(item, '2026-12-01')).toBe(true);
});

test('dueQueue caps at 15, most overdue first, and skips items not yet due', () => {
  const items: SrsItem[] = [];
  for (let i = 0; i < 20; i++) {
    items.push({ id: `o${i}`, box: 1, due: addDays(T, -(i + 1)), lastAnswered: '2026-10-01' });
  }
  items.push({ id: 'future', box: 1, due: addDays(T, 2), lastAnswered: T });
  const q = dueQueue(items, T);
  expect(q).toHaveLength(15);
  expect(q.map((x) => x.id)).not.toContain('future');
  for (let i = 1; i < q.length; i++) expect(q[i - 1].due <= q[i].due).toBe(true);
  expect(q[0].id).toBe('o19');
});
