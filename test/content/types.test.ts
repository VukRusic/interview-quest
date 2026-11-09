import { validateContent, indexItems } from '../../src/content/index';
import { UnitSchema, type Unit } from '../../src/content/types';

function unitWith(steps: unknown[]): Unit {
  return UnitSchema.parse({
    id: 'u',
    title: 'U',
    lessons: [{ id: 'l1', title: 'L1', pillar: 'design', slot: 'lesson', steps }],
  });
}

const quiz = (id: string, answer = 0) => ({
  kind: 'quiz',
  id,
  topic: 'caching',
  prompt: 'p',
  options: ['a', 'b', 'c'],
  answer,
  why: 'w',
});

const tenLines = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
const bug = (bugLines: number[]) => ({
  kind: 'bug',
  id: 'b1',
  topic: 'async',
  lang: 'csharp',
  code: tenLines,
  bugLines,
  options: ['x', 'y'],
  answer: 1,
  why: 'w',
  fix: 'f',
});

test('valid content has no errors', () => {
  expect(validateContent([unitWith([quiz('q1'), bug([3])])])).toEqual([]);
});

test('flags a duplicate id', () => {
  const errors = validateContent([unitWith([quiz('q1'), quiz('q1')])]);
  expect(errors.join('\n')).toMatch(/duplicate.*q1/i);
});

test('flags an answer out of range', () => {
  const errors = validateContent([unitWith([quiz('q1', 5)])]);
  expect(errors.join('\n')).toMatch(/q1.*answer/i);
});

test('flags bugLines outside the snippet', () => {
  const errors = validateContent([unitWith([bug([20])])]);
  expect(errors.join('\n')).toMatch(/b1.*bugLines/i);
});

test('schema rejects an unknown step kind', () => {
  expect(() => unitWith([{ kind: 'nope' }])).toThrow();
});

test('indexItems maps every step with an id to its lesson', () => {
  const idx = indexItems([unitWith([{ kind: 'explain', title: 't', body: 'b' }, quiz('q1')])]);
  expect([...idx.keys()]).toEqual(['q1']);
  expect(idx.get('q1')?.lessonId).toBe('l1');
});
