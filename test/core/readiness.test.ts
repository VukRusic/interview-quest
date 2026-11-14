import { practised, readiness } from '../../src/core/readiness';
import { indexItems } from '../../src/content/index';
import { UnitSchema } from '../../src/content/types';
import type { SrsItem } from '../../src/core/srs';

const q = (id: string, topic = 't') => ({ kind: 'quiz', id, topic, prompt: 'p', options: ['a', 'b'], answer: 0, why: 'w' });
const items = indexItems([
  UnitSchema.parse({
    id: 'u',
    title: 'U',
    lessons: [
      {
        id: 'l',
        title: 'L',
        pillar: 'design',
        slot: 'lesson',
        steps: [
          q('a1'),
          q('a2'),
          q('b1', 'mixed'),
          { kind: 'mock', id: 'm1', topic: 'mixed', prompt: 'p', followUps: [], rubric: ['r'] },
          q('other', 'empty'),
        ],
      },
    ],
  }),
]);

const srs = (id: string, box: SrsItem['box']): SrsItem => ({ id, box, due: '2026-12-01', lastAnswered: '2026-11-10' });
const base = { srs: {}, selfGrades: {}, completed: {} };

test('two auto items at box 4 and box 2 → 0.75', () => {
  expect(readiness('t', { ...base, srs: { a1: srs('a1', 4), a2: srs('a2', 2) } }, items)).toBe(0.75);
});

test('a fully self-graded mock plus an auto item at box 4 earns everything the topic can → 1', () => {
  expect(readiness('mixed', { ...base, srs: { b1: srs('b1', 4) }, selfGrades: { m1: 1 } }, items)).toBe(1);
});

test('self-graded work still counts half next to auto work: mock 1, quiz box 0 → 0.5 of 1.5', () => {
  expect(readiness('mixed', { ...base, srs: { b1: srs('b1', 0) }, selfGrades: { m1: 1 } }, items)).toBeCloseTo(1 / 3);
});

test('unknown progress ids are ignored', () => {
  const p = { ...base, srs: { a1: srs('a1', 4), gone: srs('gone', 4) }, selfGrades: { gone: 1 } };
  expect(readiness('t', p, items)).toBe(0.5);
});

test('a topic with no progress is 0', () => {
  expect(readiness('empty', base, items)).toBe(0);
  expect(readiness('no-such-topic', base, items)).toBe(0);
});

const story = (id: string, topic: string) => ({ kind: 'story', id, topic, prompt: 'p', hints: [] });
const more = indexItems([
  UnitSchema.parse({
    id: 'u',
    title: 'U',
    lessons: [
      {
        id: 'l',
        title: 'L',
        pillar: 'design',
        slot: 'lesson',
        steps: [
          story('s1', 'solo'),
          q('d1', 'df'),
          q('d2', 'df'),
          q('d3', 'df'),
          q('d4', 'df'),
          { kind: 'mock', id: 'dm', topic: 'df', prompt: 'p', followUps: [], rubric: ['r'] },
        ],
      },
    ],
  }),
]);

test('a story-only topic reaches 1 at a top self-grade', () => {
  expect(readiness('solo', { ...base, selfGrades: { s1: 1 } }, more)).toBe(1);
  expect(readiness('solo', { ...base, selfGrades: { s1: 0.5 } }, more)).toBe(0.5);
  expect(readiness('solo', base, more)).toBe(0);
});

test('four quizzes at box 1 plus a mock graded 1 → 1.5 / 4.5', () => {
  const p = { ...base, srs: { d1: srs('d1', 1), d2: srs('d2', 1), d3: srs('d3', 1), d4: srs('d4', 1) }, selfGrades: { dm: 1 } };
  expect(readiness('df', p, more)).toBeCloseTo(1 / 3);
});

test('a topic with no items is 0, not NaN', () => {
  expect(readiness('nope', base, more)).toBe(0);
  expect(practised('nope', base, more)).toBe(0);
});

test('practised counts answered and self-graded items, whatever the box', () => {
  expect(practised('df', { ...base, srs: { d1: srs('d1', 0), d2: srs('d2', 3) } }, more)).toBeCloseTo(2 / 5);
  expect(practised('df', { ...base, srs: { d1: srs('d1', 0) }, selfGrades: { dm: 0 } }, more)).toBeCloseTo(2 / 5);
});

test('practised ignores progress ids that are not in the topic', () => {
  expect(practised('df', { ...base, srs: { a1: srs('a1', 4), gone: srs('gone', 4) }, selfGrades: { s1: 1 } }, more)).toBe(0);
});

test('the Milestone 1 export never reads lower under the new formula', async () => {
  const { ITEMS, TOPICS } = await import('../../src/content/index');
  const box1 = ['df-first-move', 'df-estimates', 'df-time', 'df-tradeoffs', 'sandbox-slow-product-page', 'sql-composite-order',
    'sql-function-on-column', 'sql-covering', 'sql-index-cost', 'cache-aside-who', 'cache-invalidate', 'cache-ttl',
    'cache-stampede-name', 'cache-stampede-fix', 'tp-which-palindrome', 'tp-which-unsorted', 'bug-angular-subscribe', 'bug-sql-fstring'];
  const box0 = ['tp-which-sorted', 'py-pair-with-sum', 'bug-async-void', 'bug-ef-n-plus-one', 'bug-stale-closure'];
  const p = {
    ...base,
    srs: Object.fromEntries([...box1.map((id) => [id, srs(id, 1)]), ...box0.map((id) => [id, srs(id, 0)])]),
    selfGrades: { 'mock-url': 1 },
  };
  for (const id of [...box1, ...box0, 'mock-url']) expect(ITEMS.has(id), id).toBe(true);
  const old = (topic: string) => {
    let earned = 0;
    let count = 0;
    for (const [id, { step }] of ITEMS) {
      if (step.topic !== topic) continue;
      count++;
      if (step.kind === 'mock' || step.kind === 'story') earned += 0.5 * (p.selfGrades[id as 'mock-url'] ?? 0);
      else earned += (p.srs[id]?.box ?? 0) / 4;
    }
    return count === 0 ? 0 : earned / count;
  };
  for (const t of TOPICS) expect(readiness(t, p), t).toBeGreaterThanOrEqual(old(t));
  expect(readiness('design-flow', p)).toBeCloseTo(1.5 / 4.5);
  expect(readiness('behavioural', p)).toBe(0);
});
