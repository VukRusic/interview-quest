import { readiness } from '../../src/core/readiness';
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

test('a fully self-graded mock counts half, plus an auto item at box 4 → 0.75', () => {
  expect(readiness('mixed', { ...base, srs: { b1: srs('b1', 4) }, selfGrades: { m1: 1 } }, items)).toBe(0.75);
});

test('unknown progress ids are ignored', () => {
  const p = { ...base, srs: { a1: srs('a1', 4), gone: srs('gone', 4) }, selfGrades: { gone: 1 } };
  expect(readiness('t', p, items)).toBe(0.5);
});

test('a topic with no progress is 0', () => {
  expect(readiness('empty', base, items)).toBe(0);
  expect(readiness('no-such-topic', base, items)).toBe(0);
});
