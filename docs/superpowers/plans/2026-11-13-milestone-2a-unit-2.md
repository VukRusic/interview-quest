# Milestone 2a (app changes + Unit 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Unit 2 ("Traffic and failure", 10 lessons) with a two-new-lessons-a-day limit, tech talk and AI pillars, and progress bars that show practised work and can reach 100%.

**Architecture:** Pure logic changes in `src/core` (session, readiness, sandbox) with tests first; small UI changes in Home, the lesson route, the readiness map and the quiz step; then content as typed data in `src/content/unit2.ts`, validated by the existing content tests widened to all units. No storage format change.

**Tech Stack:** unchanged (Vite, React 19, TypeScript strict, zod, Vitest + Testing Library, React Flow, Pyodide). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-milestone-2-design.md` (amends `2026-11-10-interview-quest-design.md`, which still binds). Delivery 2b (the `prompt` step and Unit 3) gets its own plan after 2a ships.

## Global Constraints

- Free tier only: no paid services, no runtime AI, no backend, no accounts, no new npm dependencies.
- Branch `milestone-2`. TDD: failing test first, for logic and for UI behaviour. Commit after each task.
- Do not push. The owner says when; pushing `main` deploys.
- `iq.progress.v1` keeps its shape and meaning. Existing unit, lesson and item ids never change.
- Wrong technical content is a failure. Every new item goes into `src/content/REVIEW.md` under a "Unit 2" heading in the task that adds it.
- Copy rules from the specs: calm and encouraging; no timers, countdowns or loss language; sandbox numbers labelled illustrative; AI content names no prices, model names or context sizes.
- Tech talk cards: an interviewer could plausibly raise the term in a design or experience conversation. No version numbers, flags or framework details. No Angular anywhere in Unit 2.
- Bug cards are C#, TypeScript or Python.
- Pixel-medieval style via existing tokens in `src/styles/tokens.css`; check phone width (≤560px) and dark mode.

## Review Focus

1. **Saved progress from Milestone 1** (7 lessons completed across two days, a self-grade of 1, no stories): nothing is lost, no bar is lower than before, and the remaining Unit 1 story lesson is offered today. Test in Task 2 and Task 3.
2. **More than two lessons completed "today"** (imported file, or progress made before the limit existed): remaining allowance is 0, never negative; all of them still show as done. Test in Task 3.
3. **A held lesson opened by address** (`#/lesson/<id>` from history or a bookmark): shows the "Tomorrow" notice, not the lesson, and never a blank screen. Test in Task 4.
4. **Midnight passes while a lesson is open**: the lesson stays on screen and can be finished; it counts toward the new day. Test in Task 4.
5. **A topic whose only items are self-graded, or that has no items**: readiness is 0–1 with no division by zero; a top self-grade reads 100%. Test in Task 2.

---

### Task 1: Pillars `talk` and `ai`, and `lookUp` on quiz cards

**Files:**
- Modify: `src/content/types.ts` (PillarSchema, QuizStepSchema)
- Modify: `src/ui/labels.ts` (PILLAR_LABELS)
- Modify: `src/ui/steps/QuizStep.tsx`
- Test: `test/content/types.test.ts`, `test/ui/QuizStep.test.tsx`

**Interfaces:**
- Produces: `Pillar` now includes `'talk' | 'ai'`; `QuizStep.lookUp?: string`; `PILLAR_LABELS.talk === 'Tech talk'`, `PILLAR_LABELS.ai === 'Working with AI'`.

- [ ] **Step 1: Failing tests**

```ts
// types.test.ts
test('talk and ai are pillars', () => {
  expect(PillarSchema.parse('talk')).toBe('talk');
  expect(PillarSchema.parse('ai')).toBe('ai');
});
test('a quiz step may carry a lookUp phrase but not a URL', () => {
  const base = { kind: 'quiz', id: 'q', topic: 't', prompt: 'p', options: ['a', 'b'], answer: 0, why: 'w' };
  expect(QuizStepSchema.parse({ ...base, lookUp: 'consistent hashing' }).lookUp).toBe('consistent hashing');
  expect(() => QuizStepSchema.parse({ ...base, lookUp: 'https://example.com' })).toThrow();
});
```

```tsx
// QuizStep.test.tsx — follow the file's existing render helper
test('shows the look-up phrase only after answering', async () => {
  // render a quiz step with lookUp: 'consistent hashing'
  expect(screen.queryByText(/Look up:/)).toBeNull();
  // answer any option
  expect(screen.getByText('Look up: consistent hashing')).toBeInTheDocument();
});
test('no look-up line when the step has none', ...); // answer, then queryByText(/Look up:/) is null
```

- [ ] **Step 2:** Run `pnpm vitest run test/content/types.test.ts test/ui/QuizStep.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Add the two pillars; add `lookUp: z.string().min(2).max(80).refine((s) => !/https?:|www\./i.test(s)).optional()`; add the labels; render `Look up: {lookUp}` inside the existing after-answer feedback block, as muted small text.
- [ ] **Step 4:** Run the same command, then `pnpm tsc -b` (the `Record<Pillar, string>` forces the labels). Expected: PASS, no type errors.
- [ ] **Step 5:** Commit `feat: tech talk and AI pillars, look-up phrase on quiz cards`.

### Task 2: Readiness against what a topic can earn, plus a practised share

**Files:**
- Modify: `src/core/readiness.ts`
- Modify: `src/ui/ReadinessMap.tsx`, `src/styles/home.css`
- Test: `test/core/readiness.test.ts`, `test/ui/HomeScreen.test.tsx`

**Interfaces:**
- Produces: `readiness(topic, progress, items?)` unchanged signature, new formula; `practised(topic: string, progress: ReadinessInput, items?: ItemIndex): number` (0..1).

Formula: an auto item can earn 1 and earns `box/4`; a self-graded item can earn 0.5 and earns `0.5 × clamp01(selfGrade)`. `readiness = earned ÷ sum of what the topic's items can earn`, 0 when the topic has no items. `practised` = share of the topic's items that have an `srs` entry (auto) or a `selfGrades` entry (self), 0 when no items.

- [ ] **Step 1: Failing tests** (reuse the file's fixture builders)

```ts
test('a story-only topic reaches 1 at a top self-grade', ...);            // selfGrades 1 → 1
test('four quizzes at box 1 plus a mock graded 1 → 1.5 / 4.5', ...);       // toBeCloseTo(1/3)
test('a topic with no items is 0, not NaN', ...);
test('practised counts answered and self-graded items, whatever the box', ...); // 2 of 4 answered at box 0 → 0.5
test('practised ignores progress ids that are not in the topic', ...);
test('the Milestone 1 export never reads lower under the new formula', () => {
  // fixture: the srs/selfGrades from the owner's export shape — 14 quiz ids at box 1, 5 ids at box 0,
  // sandbox at box 1, selfGrades { 'mock-url': 1 }. For every topic in TOPICS:
  // expect(readiness(t, p)).toBeGreaterThanOrEqual(oldFormula(t, p)) where oldFormula is earned / count,
  // written inline in the test.
});
```

Update the existing test `a fully self-graded mock counts half, plus an auto item at box 4 → 0.75`: under the new formula that case is `1.5 / 1.5 = 1`; rename it and assert 1.

```tsx
// HomeScreen.test.tsx
test('a topic answered today shows a practised fill and "practised" in its status', ...);
// progress: one caching quiz at box 0 → the Caching meter has aria-valuenow 0,
// its row contains an element with class rd-practised and width 20%, and status text includes '1 of 5 practised'
```

- [ ] **Step 2:** Run `pnpm vitest run test/core/readiness.test.ts test/ui/HomeScreen.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement. In `ReadinessMap`, put `<span class="rd-practised">` behind the existing proven `<span>` in `.rd-bar` (lighter tint of the same colour token); change the intro line to "The solid fill is what held up on review days later. The lighter fill is what you have practised."; status text becomes `"{n} of {total} practised"` followed by the existing learned/self-graded parts. The percentage and `aria-valuenow` stay proven readiness.
- [ ] **Step 4:** Run `pnpm test`. Expected: all pass (LessonScreen's before/after readiness uses the same function and needs no change).
- [ ] **Step 5:** Commit `feat: readiness measured against what a topic can earn, practised fill on bars`.

### Task 3: Daily limit in the session builder

**Files:**
- Modify: `src/core/session.ts`
- Test: `test/core/session.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const DAILY_NEW_LESSONS = 2;
  export type DailySession = { review: string[]; resolve?: string; lessons: string[]; held: boolean; allDone: boolean };
  export type LessonAccess = 'done' | 'today' | 'tomorrow' | 'later';
  export function lessonAccess(session: DailySession, progress: Progress, today: DayKey, lessonId: string): LessonAccess;
  ```
- `lessons`: in trail order (units in order, lessons in order, `slot` ignored), the lessons whose `completed` date is today, plus the first `max(0, 2 − completedToday)` lessons with no `completed` entry.
- `held`: `completedToday ≥ 2` and at least one lesson has no `completed` entry. `allDone`: no lesson without a `completed` entry.
- `lessonAccess`: `'done'` if completed on an earlier day or today; `'today'` if in `session.lessons` and not completed; else `'tomorrow'` when `session.held`; else `'later'`.
- `review` and `resolve` logic is untouched.

- [ ] **Step 1: Failing tests.** Replace the lesson/practice/extras tests (lines 23–38 and 66) with:

```ts
test('fresh progress offers the first two lessons in trail order, whatever their slot', ...);
test('one finished today: it stays, plus the next one; not held', ...);
test('two finished today: both stay, nothing new, held', ...);
test('three finished today (imported progress): all three stay, nothing new, held, no negative slice', ...);
test('the next day the next two open again', ...);
test('lessons finished on earlier days are not in today’s list', ...);
test('everything finished: lessons empty unless finished today, held false, allDone true', ...);
test('the session crosses a unit boundary: last lesson of unit A and first of unit B', ...);
test('lessonAccess: done / today / tomorrow / later', ...);
test('Milestone 1 progress: seven Unit 1 lessons done earlier → the story lesson is today’s first lesson', ...);
```

- [ ] **Step 2:** Run `pnpm vitest run test/core/session.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Keep the review-cap and re-solve tests passing unchanged.
- [ ] **Step 4:** Run the same command. Expected: PASS. (`pnpm tsc -b` fails in `HomeScreen.tsx` until Task 4; that is expected.)
- [ ] **Step 5:** Commit `feat(core): two new lessons a day in the session builder`.

### Task 4: Home and the lesson route honour the limit

**Files:**
- Modify: `src/ui/HomeScreen.tsx`, `src/ui/LessonScreen.tsx` (`LessonRoute`), `src/styles/home.css`
- Test: `test/ui/HomeScreen.test.tsx`, `test/ui/LessonScreen.test.tsx`, `test/App.test.tsx` if it asserts the old cards

**Interfaces:**
- Consumes: `buildSession`, `lessonAccess`, `DailySession` from Task 3.

Behaviour:
- Today's session list: Warm-up, Re-solve (if any), then one card per `session.lessons` id, labelled with the pillar label (drop the Lesson/Practice/Extra label from cards; keep it in the trail meta).
- When `session.held`: after the cards, a calm note, exact copy: **"That's today's two new lessons. The next one opens tomorrow. Reviews and finished lessons stay open."**
- "Unit complete" block shows only when `session.allDone`; copy unchanged.
- Trail badge per `lessonAccess`: `done` → "Done" (link), `today` → "Today" (link; the first one keeps the flag sprite and reads "Next"), `tomorrow` → "Tomorrow" (no link), `later` → "Later" (no link; replaces "Locked").
- `LessonRoute`: compute the session; if `lessonAccess` is `tomorrow` or `later`, render a section with heading "Opens tomorrow" (or "Not yet" for `later`), the lesson title, one line "You can do two new lessons a day. Reviews and finished lessons stay open.", and a "Back to today" link. Decide access **once when the route mounts for that lesson id** (a `useState` initialiser), so a lesson already on screen is never replaced when the date changes or when it becomes the second completion.

- [ ] **Step 1: Failing tests**

```tsx
// HomeScreen.test.tsx
test('fresh progress: two lesson cards, the rest of the trail reads Later', ...);
test('two lessons finished today: held note shown, next trail step reads Tomorrow and is not a link', ...);
test('finished lessons stay links when held', ...);
// LessonScreen.test.tsx (render LessonRoute at /lesson/<id> with MemoryRouter initialEntries)
test('a held lesson opened by address shows "Opens tomorrow" and a way back', ...);
test('a lesson finished earlier opens even when held', ...);
test('a lesson already open stays open when today changes', ...);
// render at today=A with the lesson in today's two, rerender the provider with today=B after two other
// completions are in storage → the lesson's first step is still on screen
test('an unknown lesson id still shows "Lesson not found"', ...);
```

- [ ] **Step 2:** Run `pnpm vitest run test/ui`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `pnpm test && pnpm tsc -b`. Expected: all pass, no type errors.
- [ ] **Step 5:** Commit `feat(ui): Home and lessons hold new lessons after two a day`.

### Task 5: Sandbox models load balancing and a server failure

**Files:**
- Modify: `src/core/sandbox.ts`, `src/content/scenarios.ts`, `src/ui/steps/SandboxStep.tsx`
- Test: `test/core/sandbox.test.ts`

**Interfaces:**
- Produces: `Load.appDown?: number` (app servers that are down); `SCENARIOS['flash-sale']`.

Engine rules (illustrative, like the rest):
- Serving app servers = `(arch.lb > 0 ? arch.app : Math.min(arch.app, 1)) − (load.appDown ?? 0)`, floored at 0. Without a load balancer, extra app servers receive no traffic.
- App tier capacity uses serving servers. With 0 serving servers every non-CDN request fails and the app tier reports capacity 0 (same pattern as the downed database).
- Cost still counts every server placed.
- Existing queue rule stays: with a queue, writes reach the database at no more than half its capacity and the excess is not an error.

Scenario `flash-sale` (title "The flash sale"): start `app: 1, db: 1`; palette `['lb', 'app', 'queue', 'cache', 'replica']`; three events in this order: "Normal traffic", "Flash sale (order rush)", "One app server dies mid-sale" (`appDown: 1` on top of the sale load). The sale is write-heavy (orders), so a cache alone cannot save it. Story and lesson text explain: a load balancer spreads requests and routes around a dead server; a queue lets orders wait instead of failing. Tune `baseLoad`, the sale load, `slo` and `budget` so the tests below hold.

- [ ] **Step 1: Failing tests**

```ts
test('without a load balancer a second app server takes no traffic', ...);   // app tier capacity equal for app:1 and app:2
test('with a load balancer app capacity scales with servers', ...);
test('appDown removes serving servers; none left fails every non-CDN request', ...);
test('appDown with a load balancer and a spare server: no errors', ...);
test('slow-product-page still solves with cache + 1 replica', ...);          // regression for Unit 1
describe('flash-sale', () => {
  test('the start architecture fails the sale', ...);
  test('more app servers without a load balancer still fail', ...);
  test('load balancer + enough servers but no queue fails the sale on database writes', ...);
  test('load balancer + queue + exactly enough servers passes the sale but fails when one dies', ...);
  test('load balancer + queue + one spare server solves every event within budget', ...);
  test('the solving architecture costs no more than the budget and one more server exceeds it', ...);
});
```

- [ ] **Step 2:** Run `pnpm vitest run test/core/sandbox.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement engine and scenario. In `SandboxStep`, mark the app node "1 down" when the event has `appDown`, and show the existing hint style with "Extra app servers need a load balancer to receive traffic" when `app > 1 && lb === 0`.
- [ ] **Step 4:** Run `pnpm test`. Expected: all pass.
- [ ] **Step 5:** Commit `feat(sandbox): load balancing, app server failure, flash-sale scenario`.

### Task 6: Unit 2 scaffold and content checks for every unit

**Files:**
- Create: `src/content/unit2.ts` (exports `unit2: Unit`, id `unit-2`, title `Unit 2: Traffic and failure`)
- Modify: `src/content/index.ts` (`UNITS = [unit1, unit2]`), `src/ui/labels.ts` (topic labels), `src/content/REVIEW.md` (add "# Unit 2" heading)
- Test: create `test/content/unit2.test.ts`; modify `test/content/unit1.test.ts`

**Interfaces:**
- Produces lesson ids, in order: `load-balancing`, `queues`, `retries-idempotency`, `flash-sale`, `talk-request-path`, `sliding-window`, `talk-messaging`, `ai-tokens`, `mock-notifications`, `story-production-incident`.
- Topic ids and labels: `load-balancing` "Load balancing", `queues` "Queues", `resilience` "Timeouts and retries", `traffic-spikes` "Handling spikes", `talk-networking` "Tech talk: networking", `talk-apis` "Tech talk: APIs", `sliding-window` "Sliding window", `talk-messaging` "Tech talk: messaging", `talk-reliability` "Tech talk: reliability", `ai-tokens` "Tokens and context", `design-notifications` "Notification system", `behavioural` (existing).

- [ ] **Step 1: Failing tests** in `unit2.test.ts`:

```ts
test('unit 2 has its ten lessons in the planned order', ...);            // exact id list above
test('unit 2 has no dedicated bug-hunt lesson and no Angular', ...);     // no lesson with pillar 'review'; no step text matching /angular/i
test('every unit 2 concept lesson starts with an explain step that has a visual', ...);
// lesson ids: load-balancing, queues, retries-idempotency, sliding-window, ai-tokens
test('every unit 2 item uses a planned topic', ...);                      // the topic list above
test('every talk card has a lookUp phrase and at least three options', ...);
test('ids are unique across all units', ...);                             // validateContent(UNITS) toEqual([])
```

In `unit1.test.ts`: the topic allow-list test and the "bug cards use every language" test must scope to `unit1` instead of `UNITS`; the python test must select by id `py-pair-with-sum`.

- [ ] **Step 2:** Run `pnpm vitest run test/content`. Expected: FAIL.
- [ ] **Step 3:** Create `unit2.ts` with all ten lessons present, each with a title, pillar, slot and at least its first real step; later tasks fill them. Lessons not yet written carry one explain step so the schema passes; the order test passes now, the per-lesson tests pass as Tasks 7–11 land. Mark not-yet-passing tests `test.todo` only if needed to keep the suite green between commits, and remove every `todo` by Task 11.
- [ ] **Step 4:** Run `pnpm test`. Expected: pass (with todos listed).
- [ ] **Step 5:** Commit `feat(content): Unit 2 scaffold, content checks across units`.

### Task 7: Design lessons — load balancing, queues, retries

**Files:**
- Modify: `src/content/unit2.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/LoadBalancer.tsx`, `QueueBuffer.tsx`, `RetryStorm.tsx`; register in `src/ui/visuals/index.tsx` as `load-balancer`, `queue-buffer`, `retry-storm`
- Test: `test/content/unit2.test.ts`; a render smoke test per visual in `test/ui/visuals.test.tsx`

Each lesson: one or two explain steps (first has the visual), then 4–5 quiz steps. Each visual is interactive in the way `CacheFlow` is: the reader presses something and sees the consequence.

- **`load-balancing`** (topic `load-balancing`). Must teach: why one server is a single point of failure; round robin vs least connections; health checks removing a dead server; stateless servers and where session state goes; layer 4 vs layer 7 in one sentence each. Visual: requests spread over three servers; a button kills one and traffic reroutes.
- **`queues`** (topic `queues`). Must teach: decoupling a slow step from the request; a queue absorbing a burst while consumers drain at their own rate; at-least-once delivery means consumers must tolerate duplicates; what backlog growth tells you; dead-letter queue. Visual: producer rate slider vs fixed consumer rate, backlog bar growing and draining.
- **`retries-idempotency`** (topic `resilience`). Must teach: every network call needs a timeout; retry only what is safe; exponential backoff with jitter and why synchronised retries make an outage worse; idempotency keys for payments and orders; circuit breaker in one explain paragraph. Visual: a failing dependency with "retry immediately" vs "backoff + jitter" toggles showing request volume. Ends with **two bug steps**: a C# `HttpClient` call retried in a loop with no delay and no idempotency key on a POST that charges a card; a TypeScript `fetch` with no timeout/abort awaited inside a request handler.

- [ ] **Step 1:** Add tests: each of the three lessons has ≥4 quiz steps; `retries-idempotency` has exactly 2 bug steps in `csharp` and `typescript`; visuals render and respond to their control.
- [ ] **Step 2:** Run `pnpm vitest run test/content test/ui/visuals.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write content and visuals. Every quiz `why` states why the right option is right and why the most tempting wrong one is wrong.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Add each explain and item to `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): Unit 2 load balancing, queues, retries`.

### Task 8: Sandbox lesson and the sliding-window problem

**Files:**
- Modify: `src/content/unit2.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/SlidingWindow.tsx` (key `sliding-window`)
- Test: `test/content/unit2.test.ts`, `test/python/harness.test.ts`

- **`flash-sale`** (pillar `design`, slot `practice`, topic `traffic-spikes`): one explain step tying Tasks 7's three ideas to the scenario, then `{ kind: 'sandbox', id: 'sandbox-flash-sale', topic: 'traffic-spikes', scenarioId: 'flash-sale' }`.
- **`sliding-window`** (pillar `algo`, topic `sliding-window`): explain with the visual (a window sliding over an array, sum updated by one add and one subtract); 3 quiz steps on recognising the pattern (ids `sw-which-*`); one python step `py-max-window-sum`, `fn: 'max_window_sum'`, signature `max_window_sum(nums, k)` returning the largest sum of any `k` consecutive numbers, or `None` when `k` is larger than the list or `k <= 0`. At least 7 tests including negatives, `k == len(nums)`, `k == 1`, `k > len(nums)`, an empty list. Walkthrough of at least 8 frames over the reference solution. Starter is a correct-signature stub returning `None`.

- [ ] **Step 1:** Tests: the sandbox step points at `flash-sale`; the python step has ≥7 tests and ≥8 frames; in `harness.test.ts`, extend the existing CPython run so **every** python step's `reference` passes all of its own tests (loop over `UNITS`, skip if `python3` is unavailable exactly as the file already does).
- [ ] **Step 2:** Run `pnpm vitest run test/content test/python`. Expected: FAIL.
- [ ] **Step 3:** Write content and the visual.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): flash-sale sandbox lesson, sliding window`.

### Task 9: Tech talk decks

**Files:**
- Modify: `src/content/unit2.ts`, `src/content/REVIEW.md`
- Test: `test/content/unit2.test.ts`

Each deck: pillar `talk`, slot `lesson`, one explain step (two or three sentences on how these terms come up in interviews; no visual required), then the cards. Each card: prompt names the term in a realistic interviewer sentence, 3–4 options that are descriptions, `why` of 2–4 sentences, `lookUp` phrase.

- **`talk-request-path`** — 9 cards. Topic `talk-networking`: DNS resolution and TTL; what a CDN caches and where; TLS termination; reverse proxy vs load balancer; HTTP keep-alive / HTTP/2 multiplexing. Topic `talk-apis`: API gateway responsibilities; REST vs gRPC; WebSockets vs server-sent events vs long polling; pagination by offset vs cursor.
- **`talk-messaging`** — 9 cards. Topic `talk-messaging`: log-based broker vs message queue (Kafka-style vs RabbitMQ-style); pub/sub vs work queue; at-most-once / at-least-once / exactly-once; dead-letter queue; consumer groups and partitions. Topic `talk-reliability`: backpressure; circuit breaker states; token bucket vs fixed window rate limiting; bulkhead.

- [ ] **Step 1:** Tests: each deck has exactly 9 quiz steps split across its two topics as listed; ids prefixed `tt-`; every `lookUp` is unique within the unit.
- [ ] **Step 2:** Run `pnpm vitest run test/content`. Expected: FAIL.
- [ ] **Step 3:** Write the cards. Wrong options must be true statements about a *different* term from the same area, so picking by elimination teaches something.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): tech talk decks for networking and messaging`.

### Task 10: AI lesson, mock interview, story

**Files:**
- Modify: `src/content/unit2.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/TokenWindow.tsx` (key `token-window`)
- Test: `test/content/unit2.test.ts`, `test/ui/visuals.test.tsx`

- **`ai-tokens`** (pillar `ai`, topic `ai-tokens`). Before writing, read current Anthropic documentation on tokens, context windows, prompt caching and pricing structure, and write only what holds across models. Must teach: a token is a chunk of text, not a word, and counts differ by model and language; the context window holds input **and** output, and the whole conversation is resent each turn; input and output are billed separately and output costs more per token; long stable prefixes can be cached; limiting output length and trimming context are the two main cost levers; retrieval puts only the relevant pieces in context. Visual: a bar for the context window filling with system prompt, history, documents and reply as the reader adds turns. 5 quiz steps (ids `ai-tok-*`). No prices, model names or window sizes in any text; a test enforces `/\$\d|claude-|\d+k tokens|\d{3},\d{3}/i` matches nothing in the lesson.
- **`mock-notifications`** (pillar `design`, slot `practice`, topic `design-notifications`): a mock step `mock-notifications`. Prompt: design a service that sends push, email and SMS notifications for other teams' events. 5 follow-ups covering: volume estimate; what happens when a provider is down (retries, backoff, dead-letter); avoiding duplicate sends (idempotency key); user preferences and rate limits per user; priority (a login code vs a marketing push). Rubric of 6–8 lines that reward using Unit 2's ideas by name.
- **`story-production-incident`** (pillar `stories`, slot `extra`, topic `behavioural`): a story step `story-production-incident`. Prompt: a time something broke in production and what you did. Hints stay generic (what you noticed, what you ruled out, the fix, what changed afterwards), as in Unit 1, because stories never go in the repo.

- [ ] **Step 1:** Tests: `ai-tokens` has 5 quiz steps and passes the no-stale-facts regex; the mock has 5 follow-ups and a 6–8 line rubric; the story has ≥3 hints; the visual renders and adding a turn grows the bar.
- [ ] **Step 2:** Run `pnpm vitest run test/content test/ui/visuals.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write content and the visual.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS, with no `test.todo` left anywhere (`grep -rn "test.todo" test` prints nothing). Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): AI tokens lesson, notification-system mock, incident story`.

### Task 11: Play it through, then whole-branch review

**Files:** none planned; fixes found here get their own failing test first.

- [ ] **Step 1:** `pnpm test && pnpm tsc -b && pnpm build`. Expected: all pass, build succeeds.
- [ ] **Step 2:** Start the `dev` server from `.claude/launch.json`. In the built-in browser at phone width, light then dark, with fresh storage:
  - complete two Unit 1 lessons; Home shows the held note; the third trail step reads "Tomorrow" and does not open, including by address;
  - a caching quiz answered today shows the lighter practised fill and 0% proven;
  - reload with `?today=` one day later; two more lessons open.
- [ ] **Step 3:** Import a progress file with all eight Unit 1 lessons completed on earlier days (build it from the Milestone 1 export shape). Then, moving the date forward as needed, play every Unit 2 lesson: each visual responds; a tech talk card shows "Look up: …" after answering; the flash sale is solvable and the hint about load balancers appears; `max_window_sum` passes with the reference solution; the mock saves its answer and self-grade; the story saves.
- [ ] **Step 4:** Read `src/content/REVIEW.md`'s Unit 2 section against `unit2.ts`: every explain and item is listed.
- [ ] **Step 5:** Run the requesting-code-review skill on the whole branch against both specs; fix what it finds test-first; commit.
- [ ] **Step 6:** Report to the owner with what was verified and what was not. Do not merge or push until they say so.
