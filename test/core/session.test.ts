import { buildSession, lessonAccess } from '../../src/core/session';
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

const Y = '2026-11-09';
const unitB: Unit = UnitSchema.parse({ id: 'u2', title: 'U2', lessons: [lesson('b1', 'lesson'), lesson('b2', 'practice')] });

test('fresh progress offers the first two lessons in trail order, whatever their slot', () => {
  expect(buildSession([unit], emptyProgress(), T)).toEqual({ review: [], resolve: undefined, lessons: ['l1', 'p1'], held: false, allDone: false });
});

test('one finished today: it stays, plus the next one; not held', () => {
  const s = buildSession([unit], withCompleted({ l1: T }), T);
  expect(s.lessons).toEqual(['l1', 'p1']);
  expect(s.held).toBe(false);
});

test('two finished today: both stay, nothing new, held', () => {
  const s = buildSession([unit], withCompleted({ l1: T, p1: T }), T);
  expect(s.lessons).toEqual(['l1', 'p1']);
  expect(s.held).toBe(true);
});

test('three finished today (imported progress): all three stay, nothing new, held', () => {
  const s = buildSession([unit], withCompleted({ l1: T, p1: T, l2: T }), T);
  expect(s.lessons).toEqual(['l1', 'p1', 'l2']);
  expect(s.held).toBe(true);
});

test('the next day the next two open again', () => {
  const s = buildSession([unit], withCompleted({ l1: Y, p1: Y }), T);
  expect(s.lessons).toEqual(['l2', 'x1']);
  expect(s.held).toBe(false);
});

test('lessons finished on earlier days are not in today’s list', () => {
  expect(buildSession([unit], withCompleted({ l1: Y }), T).lessons).toEqual(['p1', 'l2']);
});

test('a lesson finished out of order today still counts toward the two', () => {
  expect(buildSession([unit], withCompleted({ l2: T }), T).lessons).toEqual(['l1', 'l2']);
});

test('the session crosses a unit boundary', () => {
  const p = withCompleted({ l1: Y, p1: Y, l2: Y, x1: Y });
  expect(buildSession([unit, unitB], p, T).lessons).toEqual(['x2', 'b1']);
});

test('Milestone 1 progress: seven lessons done earlier → the last one is today’s first lesson', () => {
  const p = withCompleted({ l1: '2026-11-12', p1: '2026-11-12', l2: '2026-11-12', x1: '2026-11-13' });
  const s = buildSession([unit, unitB], p, '2026-11-14');
  expect(s.lessons).toEqual(['x2', 'b1']);
  expect(s.held).toBe(false);
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

test('everything finished earlier: no lessons, not held, allDone', () => {
  const all = withCompleted({ l1: '2026-11-01', p1: '2026-11-01', l2: '2026-11-02', x1: '2026-11-02', x2: '2026-11-02' });
  expect(buildSession([unit], all, T)).toMatchObject({ lessons: [], held: false, allDone: true });
});

test('the last two finished today: they stay listed, not held (nothing is waiting), allDone', () => {
  const all = withCompleted({ l1: Y, p1: Y, l2: Y, x1: T, x2: T });
  expect(buildSession([unit], all, T)).toMatchObject({ lessons: ['x1', 'x2'], held: false, allDone: true });
});

test('lessonAccess: done / today / tomorrow / later', () => {
  const open = withCompleted({ l1: Y });
  const s1 = buildSession([unit], open, T);
  expect(lessonAccess(s1, open, 'l1')).toBe('done');
  expect(lessonAccess(s1, open, 'p1')).toBe('today');
  expect(lessonAccess(s1, open, 'l2')).toBe('today');
  expect(lessonAccess(s1, open, 'x1')).toBe('later');
  const full = withCompleted({ l1: T, p1: T });
  const s2 = buildSession([unit], full, T);
  expect(lessonAccess(s2, full, 'l1')).toBe('done');
  expect(lessonAccess(s2, full, 'l2')).toBe('tomorrow');
  expect(lessonAccess(s2, full, 'x2')).toBe('tomorrow');
});

describe('re-solve: full problems come back occasionally', () => {
  const probUnit: Unit = UnitSchema.parse({
    id: 'u',
    title: 'U',
    lessons: [
      {
        id: 'lp',
        title: 'P',
        pillar: 'algo',
        slot: 'lesson',
        steps: [
          { kind: 'sandbox', id: 'sb', topic: 't', scenarioId: 'x' },
          { kind: 'python', id: 'py', topic: 't', prompt: 'p', fn: 'f', starter: '', tests: [{ args: [], expected: null }], walkthrough: [], reference: 'x' },
        ],
      },
    ],
  });
  const srs = (id: string, due: string) => ({ id, box: 0 as const, due, lastAnswered: '2026-11-01' });

  test('the most overdue due problem is offered as a re-solve, never in the quick review', () => {
    const p: Progress = { ...emptyProgress(), srs: { sb: srs('sb', '2026-11-09'), py: srs('py', '2026-11-05') } };
    const s = buildSession([probUnit], p, T);
    expect(s.resolve).toBe('py');
    expect(s.review).toEqual([]);
  });

  test('nothing due → no re-solve', () => {
    const p: Progress = { ...emptyProgress(), srs: { py: srs('py', '2026-11-20') } };
    expect(buildSession([probUnit], p, T).resolve).toBeUndefined();
  });

  test('a problem re-solved today stays in today’s session', () => {
    const p: Progress = { ...emptyProgress(), srs: { py: { id: 'py', box: 1, due: '2026-11-13', lastAnswered: T } } };
    expect(buildSession([probUnit], p, T).resolve).toBe('py');
  });
});
