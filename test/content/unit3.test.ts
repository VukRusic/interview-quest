import { UNITS, validateContent, indexItems } from '../../src/content/index';
import { unit3 } from '../../src/content/unit3';
import { SCENARIOS } from '../../src/content/scenarios';
import { estimateTokens } from '../../src/core/tokens';

const lesson = (id: string) => unit3.lessons.find((l) => l.id === id)!;
const kinds = (id: string, kind: string) => lesson(id).steps.filter((s) => s.kind === kind);
const item = (id: string) => indexItems([unit3]).get(id)!.step;
const text = JSON.stringify(unit3);
void SCENARIOS; void estimateTokens; void kinds; void item;

test('unit 3 is the third unit and has its eleven lessons in the planned order', () => {
  expect(UNITS[2]).toBe(unit3);
  expect(unit3.lessons.map((l) => l.id)).toEqual([
    'sql-vs-nosql', 'replication', 'sharding', 'consistency', 'dashboard-rush', 'talk-data-stores', 'hash-map',
    'dotnet-async', 'ai-prompt-budget', 'mock-news-feed', 'story-tradeoff',
  ]);
});

test('unit 3 has no bug-hunt lesson and no Angular', () => {
  expect(unit3.lessons.filter((l) => l.pillar === 'review')).toEqual([]);
  expect(text).not.toMatch(/angular/i);
});

test('ids are unique across all units', () => {
  expect(validateContent(UNITS)).toEqual([]);
});

test('every unit 3 item uses a planned topic', () => {
  const topics = new Set([
    'data-modelling', 'replication', 'sharding', 'consistency', 'scaling-db', 'talk-storage', 'talk-search-analytics',
    'hash-map', 'dotnet-async', 'ai-prompts', 'design-feed', 'behavioural',
  ]);
  for (const { step } of indexItems([unit3]).values()) expect(topics.has(step.topic), `${step.id}: ${step.topic}`).toBe(true);
});

test('pillars and slots are as planned', () => {
  expect(unit3.lessons.map((l) => l.pillar)).toEqual([
    'design', 'design', 'design', 'design', 'design', 'talk', 'algo', 'stack', 'ai', 'design', 'stories',
  ]);
  expect(unit3.lessons.map((l) => l.slot)).toEqual([
    'lesson', 'lesson', 'lesson', 'lesson', 'practice', 'lesson', 'lesson', 'lesson', 'lesson', 'extra', 'extra',
  ]);
});

describe('design lessons', () => {
  const visuals: Record<string, string> = {
    'sql-vs-nosql': 'data-shapes',
    replication: 'replication-lag',
    sharding: 'shard-keys',
    consistency: 'quorum',
  };

  test.each(Object.keys(visuals))('%s opens with its visual and has at least 4 real quiz steps', (id) => {
    const first = lesson(id).steps[0];
    expect(first.kind === 'explain' && first.visual).toBe(visuals[id]);
    const quiz = kinds(id, 'quiz');
    expect(quiz.length).toBeGreaterThanOrEqual(4);
    for (const q of quiz) if (q.kind === 'quiz') expect(q.why.length, q.id).toBeGreaterThan(80);
  });

  test('consistency ends with two bug cards, C# then Python', () => {
    const steps = lesson('consistency').steps;
    expect(steps.slice(-2).map((s) => s.kind === 'bug' && `${s.id}:${s.lang}`)).toEqual([
      'bug-read-after-write:csharp',
      'bug-lost-update:python',
    ]);
    expect(kinds('consistency', 'bug')).toHaveLength(2);
  });

  test('the quorum question has the arithmetic right: 5 replicas, W = 3 → R = 3', () => {
    const q = item('cons-quorum');
    if (q.kind !== 'quiz') throw new Error('not a quiz');
    expect(q.options[q.answer]).toBe('3');
  });

  test('CAP is stated as a choice during a partition, not "pick any two"', () => {
    const q = item('cons-cap');
    if (q.kind !== 'quiz') throw new Error('not a quiz');
    expect(q.options[q.answer]).toMatch(/network|partition/i);
    expect(q.options[q.answer]).not.toMatch(/any two/i);
  });
});
