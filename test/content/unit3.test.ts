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
