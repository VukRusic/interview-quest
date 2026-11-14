import { UNITS, validateContent, indexItems } from '../../src/content/index';
import { unit2 } from '../../src/content/unit2';
import { SCENARIOS } from '../../src/content/scenarios';

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

describe('design lessons', () => {
  const kinds = (id: string, kind: string) => lesson(id).steps.filter((s) => s.kind === kind);

  test.each(['load-balancing', 'queues', 'retries-idempotency'])('%s opens with a visual and has at least 4 quiz steps', (id) => {
    const first = lesson(id).steps[0];
    expect(first.kind === 'explain' && first.visual).toBeTruthy();
    expect(kinds(id, 'quiz').length).toBeGreaterThanOrEqual(4);
  });

  test('retries-idempotency ends with two bug cards, one C# and one TypeScript', () => {
    const bugs = kinds('retries-idempotency', 'bug');
    expect(bugs.map((b) => b.kind === 'bug' && b.lang)).toEqual(['csharp', 'typescript']);
    expect(lesson('retries-idempotency').steps.slice(-2).map((s) => s.kind)).toEqual(['bug', 'bug']);
  });

  test('every quiz explanation is a real explanation', () => {
    for (const id of ['load-balancing', 'queues', 'retries-idempotency'])
      for (const s of lesson(id).steps) if (s.kind === 'quiz') expect(s.why.length, s.id).toBeGreaterThan(80);
  });
});

describe('practice lessons', () => {
  test('flash-sale explains first, then runs the flash-sale scenario', () => {
    const steps = lesson('flash-sale').steps;
    expect(steps.map((s) => s.kind)).toEqual(['explain', 'sandbox']);
    expect(steps[1]).toMatchObject({ id: 'sandbox-flash-sale', topic: 'traffic-spikes', scenarioId: 'flash-sale' });
  });

  test('sliding-window: a visual, three recognition questions, then the problem', () => {
    const steps = lesson('sliding-window').steps;
    const first = steps[0];
    expect(first.kind === 'explain' && first.visual).toBe('sliding-window');
    const quiz = steps.filter((s) => s.kind === 'quiz');
    expect(quiz).toHaveLength(3);
    for (const q of quiz) expect(q.kind === 'quiz' && q.id.startsWith('sw-which-')).toBe(true);
    const p = steps[steps.length - 1];
    expect(p.kind === 'python' && p.id).toBe('py-max-window-sum');
    if (p.kind !== 'python') return;
    expect(p.fn).toBe('max_window_sum');
    expect(p.tests.length).toBeGreaterThanOrEqual(7);
    expect(p.walkthrough.length).toBeGreaterThanOrEqual(8);
  });
});

describe('tech talk decks', () => {
  const cards = (id: string) => lesson(id).steps.flatMap((s) => (s.kind === 'quiz' ? [s] : []));
  const byTopic = (id: string) => {
    const out: Record<string, number> = {};
    for (const c of cards(id)) out[c.topic] = (out[c.topic] ?? 0) + 1;
    return out;
  };

  test('each deck is one short intro and nine cards over its two topics', () => {
    for (const id of ['talk-request-path', 'talk-messaging']) {
      expect(lesson(id).steps[0].kind).toBe('explain');
      expect(lesson(id).steps.slice(1).every((s) => s.kind === 'quiz')).toBe(true);
      expect(cards(id)).toHaveLength(9);
    }
    expect(byTopic('talk-request-path')).toEqual({ 'talk-networking': 5, 'talk-apis': 4 });
    expect(byTopic('talk-messaging')).toEqual({ 'talk-messaging': 5, 'talk-reliability': 4 });
  });

  test('every card has a tt- id, at least three options, a real explanation and a look-up phrase', () => {
    for (const c of [...cards('talk-request-path'), ...cards('talk-messaging')]) {
      expect(c.id.startsWith('tt-'), c.id).toBe(true);
      expect(c.options.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.why.length, c.id).toBeGreaterThan(80);
      expect(c.lookUp, c.id).toBeTruthy();
    }
  });

  test('look-up phrases are unique', () => {
    const phrases = [...cards('talk-request-path'), ...cards('talk-messaging')].map((c) => c.lookUp);
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  test('the right answer is not always in the same position', () => {
    for (const id of ['talk-request-path', 'talk-messaging'])
      expect(new Set(cards(id).map((c) => c.answer)).size, id).toBeGreaterThanOrEqual(3);
  });
});

describe('AI lesson, mock interview and story', () => {
  test('ai-tokens opens with a visual and has five questions', () => {
    const steps = lesson('ai-tokens').steps;
    const first = steps[0];
    expect(first.kind === 'explain' && first.visual).toBe('token-window');
    const quiz = steps.filter((s) => s.kind === 'quiz');
    expect(quiz).toHaveLength(5);
    for (const q of quiz) expect(q.kind === 'quiz' && q.id.startsWith('ai-tok-') && q.topic === 'ai-tokens').toBe(true);
  });

  test('ai-tokens names no prices, model ids or window sizes that would go stale', () => {
    expect(JSON.stringify(lesson('ai-tokens'))).not.toMatch(/\$\d|claude-|\d+k tokens|\d{3},\d{3}|opus|sonnet|haiku|gpt/i);
  });

  test('the notification mock has five follow-ups and a rubric of six to eight lines', () => {
    const steps = lesson('mock-notifications').steps;
    expect(steps).toHaveLength(1);
    const m = steps[0];
    expect(m.kind === 'mock' && m.id).toBe('mock-notify');
    if (m.kind !== 'mock') return;
    expect(m.topic).toBe('design-notifications');
    expect(m.followUps).toHaveLength(5);
    expect(m.rubric.length).toBeGreaterThanOrEqual(6);
    expect(m.rubric.length).toBeLessThanOrEqual(8);
    expect(m.rubric.join(' ')).toMatch(/queue/i);
    expect(m.rubric.join(' ')).toMatch(/idempotency/i);
  });

  test('the incident story has a prompt and at least three generic hints', () => {
    const s = lesson('story-production-incident').steps[0];
    expect(s.kind === 'story' && s.id).toBe('story-incident');
    if (s.kind !== 'story') return;
    expect(s.topic).toBe('behavioural');
    expect(s.hints.length).toBeGreaterThanOrEqual(3);
  });

  test('no lesson is still a placeholder', () => {
    expect(text).not.toMatch(/coming soon/i);
  });
});

describe('content corrections from review', () => {
  const item = (id: string) => indexItems([unit2]).get(id)!.step;

  test('tt-cdn: no wrong option describes something a CDN also does', () => {
    const s = item('tt-cdn');
    if (s.kind !== 'quiz') throw new Error('not a quiz');
    s.options.forEach((o, i) => { if (i !== s.answer) expect(o).not.toMatch(/decrypt|https/i); });
  });

  test('bug-retry-charge: the fix names 429 as the retryable 4xx and does not say "never 4xx"', () => {
    const s = item('bug-retry-charge');
    if (s.kind !== 'bug') throw new Error('not a bug');
    expect(s.fix).toMatch(/429/);
    expect(s.fix).not.toMatch(/never 4xx/i);
  });

  test('ai-tokens: memory claim is about the model, and the cost question is scoped to one request', () => {
    expect(JSON.stringify(lesson('ai-tokens'))).toMatch(/model itself keeps \*\*no memory between requests\*\*/);
    const s = item('ai-tok-output-cost');
    expect(s.kind === 'quiz' && s.prompt).toMatch(/single request/);
  });

  test('flash-sale: the lesson does not promise the backlog clears quickly', () => {
    expect(SCENARIOS['flash-sale'].lesson).not.toMatch(/a little later/);
    expect(SCENARIOS['flash-sale'].story).toMatch(/ten-minute/);
  });
});
