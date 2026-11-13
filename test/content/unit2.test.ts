import { UNITS, validateContent, indexItems } from '../../src/content/index';
import { unit2 } from '../../src/content/unit2';

const lesson = (id: string) => unit2.lessons.find((l) => l.id === id)!;
const text = JSON.stringify(unit2);

test('unit 2 is the second unit and has its ten lessons in the planned order', () => {
  expect(UNITS[1]).toBe(unit2);
  expect(unit2.lessons.map((l) => l.id)).toEqual([
    'load-balancing',
    'queues',
    'retries-idempotency',
    'flash-sale',
    'talk-request-path',
    'sliding-window',
    'talk-messaging',
    'ai-tokens',
    'mock-notifications',
    'story-production-incident',
  ]);
});

test('unit 2 has no dedicated bug-hunt lesson and no Angular', () => {
  expect(unit2.lessons.filter((l) => l.pillar === 'review')).toEqual([]);
  expect(text).not.toMatch(/angular/i);
});

test('ids are unique across all units', () => {
  expect(validateContent(UNITS)).toEqual([]);
});

test('every unit 2 item uses a planned topic', () => {
  const topics = new Set([
    'load-balancing', 'queues', 'resilience', 'traffic-spikes', 'talk-networking', 'talk-apis', 'sliding-window',
    'talk-messaging', 'talk-reliability', 'ai-tokens', 'design-notifications', 'behavioural',
  ]);
  for (const { step } of indexItems([unit2]).values()) expect(topics.has(step.topic), `${step.id}: ${step.topic}`).toBe(true);
});

test('the talk and AI pillars are used by the lessons planned for them', () => {
  expect(unit2.lessons.filter((l) => l.pillar === 'talk').map((l) => l.id)).toEqual(['talk-request-path', 'talk-messaging']);
  expect(lesson('ai-tokens').pillar).toBe('ai');
});
