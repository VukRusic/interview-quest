import { UNITS, validateContent, indexItems } from '../../src/content/index';
import { UnitSchema } from '../../src/content/types';
import { SCENARIOS } from '../../src/content/scenarios';
import { VISUALS } from '../../src/ui/visuals';
import { unit1 } from '../../src/content/unit1';

const steps = UNITS.flatMap((u) => u.lessons.flatMap((l) => l.steps));

test('content passes the schema and validation', () => {
  expect(() => UNITS.forEach((u) => UnitSchema.parse(u))).not.toThrow();
  expect(validateContent(UNITS)).toEqual([]);
});

test('unit 1 has 8 lessons covering every pillar, in the planned order', () => {
  expect(UNITS[0]).toBe(unit1);
  expect(unit1.lessons.map((l) => l.id)).toEqual([
    'design-flow',
    'caching',
    'slow-product-page',
    'two-pointers',
    'bug-hunt-1',
    'sql-indexes',
    'mock-url-shortener',
    'story-built-system',
  ]);
  expect(new Set(unit1.lessons.map((l) => l.pillar))).toEqual(new Set(['design', 'algo', 'review', 'stack', 'stories']));
});

test('bug cards use every language at least once', () => {
  const langs = new Set(steps.flatMap((s) => (s.kind === 'bug' ? [s.lang] : [])));
  expect(langs).toEqual(new Set(['csharp', 'typescript', 'python']));
});

test('every visual key exists', () => {
  for (const s of steps) if (s.kind === 'explain' && s.visual) expect(VISUALS[s.visual], s.visual).toBeDefined();
});

test('every walkthrough line is inside its reference solution', () => {
  for (const s of steps) {
    if (s.kind !== 'python') continue;
    const lines = s.reference.replace(/\n$/, '').split('\n').length;
    for (const f of s.walkthrough) {
      expect(f.line).toBeGreaterThanOrEqual(1);
      expect(f.line).toBeLessThanOrEqual(lines);
    }
  }
});

test('every sandbox step points at an existing scenario', () => {
  for (const s of steps) if (s.kind === 'sandbox') expect(SCENARIOS[s.scenarioId], s.scenarioId).toBeDefined();
});

test('every item uses a planned topic', () => {
  const topics = new Set(['design-flow', 'caching', 'scaling-db', 'two-pointers', 'async', 'data-access', 'frontend-state', 'security', 'sql-indexing', 'behavioural']);
  for (const { step } of indexItems(UNITS).values()) expect(topics.has(step.topic), `${step.id}: ${step.topic}`).toBe(true);
});

test('the pair_with_sum problem has at least 6 tests and 8 walkthrough frames', () => {
  const p = steps.find((s) => s.kind === 'python');
  expect(p?.kind === 'python' && p.fn).toBe('pair_with_sum');
  if (p?.kind !== 'python') return;
  expect(p.tests.length).toBeGreaterThanOrEqual(6);
  expect(p.walkthrough.length).toBeGreaterThanOrEqual(8);
});
