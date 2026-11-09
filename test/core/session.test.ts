import { buildSession } from '../../src/core/session';
import { emptyProgress, type Progress } from '../../src/state/progress';
import { UnitSchema, type Unit } from '../../src/content/types';

const quiz = (id: string) => ({ kind: 'quiz', id, topic: 't', prompt: 'p', options: ['a', 'b'], answer: 0, why: 'w' });
const lesson = (id: string, slot: string, steps: unknown[] = [quiz(`${id}-q`)]) => ({ id, title: id, pillar: 'design', slot, steps });

const unit: Unit = UnitSchema.parse({
  id: 'u1',
  title: 'U1',
  lessons: [
    lesson('l1', 'lesson'),
    lesson('p1', 'practice'),
    lesson('l2', 'lesson'),
    lesson('x1', 'extra', [{ kind: 'mock', id: 'x1-m', topic: 't', prompt: 'p', followUps: [], rubric: ['r'] }]),
    lesson('x2', 'extra'),
  ],
});
const T = '2026-11-10';

const withCompleted = (completed: Record<string, string>): Progress => ({ ...emptyProgress(), completed });

test('fresh progress: first lesson, first practice, both extras, no review', () => {
  expect(buildSession([unit], emptyProgress(), T)).toEqual({ review: [], lesson: 'l1', practice: 'p1', extras: ['x1', 'x2'] });
});

test('lesson 1 completed yesterday → lesson 2', () => {
  expect(buildSession([unit], withCompleted({ l1: '2026-11-09' }), T).lesson).toBe('l2');
});

test('lesson 1 completed today stays as today’s lesson', () => {
  expect(buildSession([unit], withCompleted({ l1: T }), T).lesson).toBe('l1');
});

test('extras completed before today drop out; ones done today stay', () => {
  expect(buildSession([unit], withCompleted({ x1: '2026-11-09', x2: T }), T).extras).toEqual(['x2']);
});

test('review holds due reviewable items only, not unknown ids or self-graded ones', () => {
  const p: Progress = {
    ...emptyProgress(),
    srs: {
      'l1-q': { id: 'l1-q', box: 0, due: T, lastAnswered: '2026-11-09' },
      gone: { id: 'gone', box: 0, due: '2026-11-01', lastAnswered: '2026-10-31' },
      'x1-m': { id: 'x1-m', box: 0, due: T, lastAnswered: '2026-11-09' },
      'l2-q': { id: 'l2-q', box: 1, due: '2026-11-12', lastAnswered: '2026-11-09' },
    },
  };
  expect(buildSession([unit], p, T).review).toEqual(['l1-q']);
});

test('review is capped at 15, most overdue first, after dropping stale ids', () => {
  const lessons = Array.from({ length: 20 }, (_, i) => lesson(`l${i}`, 'lesson'));
  const big = UnitSchema.parse({ id: 'big', title: 'B', lessons });
  const srs: Progress['srs'] = { gone: { id: 'gone', box: 0, due: '2026-01-01', lastAnswered: '2025-12-31' } };
  lessons.forEach((l, i) => {
    const id = `${l.id}-q`;
    srs[id] = { id, box: 0, due: `2026-10-${String(i + 1).padStart(2, '0')}`, lastAnswered: '2026-09-30' };
  });
  const r = buildSession([big], { ...emptyProgress(), srs }, T).review;
  expect(r).toHaveLength(15);
  expect(r[0]).toBe('l0-q');
  expect(r).not.toContain('gone');
});

test('all done → lesson and practice undefined', () => {
  const all = withCompleted({ l1: '2026-11-01', p1: '2026-11-01', l2: '2026-11-02', x1: '2026-11-02', x2: '2026-11-02' });
  const s = buildSession([unit], all, T);
  expect(s.lesson).toBeUndefined();
  expect(s.practice).toBeUndefined();
  expect(s.extras).toEqual([]);
});
