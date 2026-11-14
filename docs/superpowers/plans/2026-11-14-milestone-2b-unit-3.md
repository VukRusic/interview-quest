# Milestone 2b (prompt exercise + Unit 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Unit 3 ("Data at scale", 11 lessons) and a new self-graded exercise where the owner writes a prompt inside a token budget.

**Architecture:** One new step kind, `prompt`, built like the mock interview step: typed schema, a React step component, the draft saved in the existing `mockAnswers` map and the grade in `selfGrades`, so the storage format does not change. A pure `estimateTokens` function gives the live count. Unit 3 is typed data under `src/content/unit3/`, assembled and validated in `unit3.ts`, with one new sandbox scenario and one small engine rule (a queue holds writes while the primary is down).

**Tech Stack:** unchanged. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-milestone-2-design.md` (calls 7, 8, 10 and 11 are the ones this plan implements; it amends `2026-11-10-interview-quest-design.md`, which still binds). Delivery 2a is merged; follow its patterns in `src/content/unit2/`, `test/content/unit2.test.ts` and `test/ui/visuals.test.tsx`.

## Global Constraints

- Free tier only: no paid services, no runtime AI, no backend, no accounts, no new npm dependencies. The app never runs the prompt and never counts tokens exactly.
- Branch `milestone-2b` from `main`. TDD: failing test first. Commit after each task.
- Do not merge or push. The owner says when; pushing `main` deploys.
- `iq.progress.v1` keeps its shape and meaning. Existing unit, lesson and item ids never change.
- A step id may not equal its lesson id (`validateContent` rejects it).
- Wrong technical content is a failure. Every new item goes into `src/content/REVIEW.md` under a "Unit 3" heading in the task that adds it.
- Copy rules: calm and encouraging; no timers or loss language; sandbox and visual numbers labelled illustrative; AI content names no prices, model names or context sizes; token counts are always worded "about".
- Tech talk cards: a term an interviewer could plausibly raise; wrong options are true of a *different* term and are not also true of the term asked about; every card has a `lookUp` phrase. No Angular anywhere in Unit 3.
- Bug cards are C#, TypeScript or Python, and live inside the lesson they relate to.
- Every concept lesson opens with an explain step that has an interactive visual.
- Pixel-medieval style via existing tokens; check phone width (≤560px) and dark mode in the browser.

## Review Focus

1. **A very long paste into the prompt box** (tens of thousands of characters): the page stays responsive, the count is right, the over-budget state shows, and saving does not break progress storage. Test in Task 2.
2. **An empty or whitespace-only prompt**: counts as about 0 tokens and cannot be graded. Test in Task 2.
3. **Text that is not plain English** (code, emoji, non-Latin script): the estimate still renders and the screen says it is rougher for such text; nothing throws on surrogate pairs. Test in Task 1 and Task 2.
4. **An older cached build of the app reading progress that contains Unit 3 ids**, and this build reading progress with ids it no longer has: nothing is lost and no bar errors. Test in Task 1 (readiness ignores unknown ids, including a `prompt` id).
5. **Someone part-way through Unit 2 when Unit 3 ships**: Unit 3 appears after Unit 2 on the trail as "Later", and the daily limit carries across the unit boundary. Test in Task 4.

---

### Task 1: `prompt` step schema, token estimate, one definition of "self-graded"

**Files:**
- Create: `src/core/tokens.ts`
- Modify: `src/content/types.ts`, `src/content/index.ts` (`validateContent`), `src/core/readiness.ts`, `src/ui/ReadinessMap.tsx`
- Test: create `test/core/tokens.test.ts`; modify `test/content/types.test.ts`, `test/core/readiness.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/core/tokens.ts
  export const CHARS_PER_TOKEN = 4;
  /** Rough estimate: trimmed length in UTF-16 code units ÷ 4, rounded up. 0 for empty or whitespace. */
  export function estimateTokens(text: string): number;

  // src/content/types.ts
  export const PromptStepSchema = z.object({
    kind: z.literal('prompt'),
    id: z.string(),
    topic: z.string(),
    brief: z.string(),                 // the task, as an interviewer would give it
    material: z.string().optional(),   // source notes the writer must choose from
    budget: z.number().int().min(50),  // tokens
    rubric: z.array(z.string()).min(1),
  });
  export type PromptStep = z.infer<typeof PromptStepSchema>;
  export const SELF_KINDS = ['mock', 'story', 'prompt'] as const;
  export function isSelfKind(kind: string): boolean;   // membership in SELF_KINDS
  ```
- `StepSchema` gains `PromptStepSchema`. `readiness.ts` and `ReadinessMap.tsx` both use `isSelfKind` instead of their own `mock || story` checks.
- `validateContent` adds, for a `prompt` step with `material`: error `"<id>: material already fits the budget"` when `estimateTokens(material) <= budget` (the exercise must force choosing).

- [ ] **Step 1: Failing tests**

```ts
// tokens.test.ts
test('empty and whitespace-only text is 0', ...);                 // '', '   \n'
test('trimmed length ÷ 4, rounded up', ...);                       // 'abcd' → 1, 'abcde' → 2, '  abcd  ' → 1
test('400 characters is about 100 tokens', ...);
test('emoji and non-Latin text do not throw and count something', ...); // '👍👍' > 0, 'こんにちは' > 0
test('a 200,000 character string returns in well under 50 ms', ...);

// types.test.ts
test('a prompt step parses, and needs a budget of at least 50 and a rubric', ...);
test('validateContent rejects material that already fits the budget', ...);
test('validateContent accepts a prompt step with no material', ...);

// readiness.test.ts
test('a prompt step is self-graded: a top grade on a prompt-only topic reads 1', ...);
test('a prompt step counts half next to a quiz in the same topic', ...);     // quiz box 4 + prompt 0 → 1 / 1.5
test('practised counts a graded prompt step', ...);
test('a self-grade under an id that is not in the content is ignored', ...);
```

- [ ] **Step 2:** Run `pnpm vitest run test/core/tokens.test.ts test/content/types.test.ts test/core/readiness.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. `pnpm tsc -b` will now fail in `StepView.tsx` (no case for `prompt`); add a temporary `case 'prompt': return null;` there, replaced in Task 2.
- [ ] **Step 4:** Run `pnpm test && pnpm tsc -b`. Expected: all pass, no type errors.
- [ ] **Step 5:** Commit `feat: prompt step schema, token estimate, single definition of self-graded kinds`.

### Task 2: The prompt exercise on screen

**Files:**
- Create: `src/ui/steps/PromptStep.tsx`
- Modify: `src/ui/steps/StepView.tsx`, `src/ui/reviewPrompt.ts`, `src/styles/steps.css`
- Test: create `test/ui/PromptStep.test.tsx`; modify `test/ui/CopyForReview.test.tsx` only if it enumerates prompt builders

**Interfaces:**
- Consumes: `PromptStep`, `estimateTokens` (Task 1); `useProgress`, `CopyForReview`, the `saveMockAnswer` action and `StepProps`/`StepResult` (existing; see `MockStep.tsx`).
- Produces: `PromptStep` component; `promptReviewPrompt(step: PromptStep, draft: string): string` in `reviewPrompt.ts`.

Behaviour:
- Shows the brief, then the material (if any) in a scrollable box headed "Notes you were given", with its own count: "About N tokens, more than your budget."
- One textarea labelled "Your prompt", `maxLength={20000}`, initial value from `progress.mockAnswers[step.id]`, saved on every change with `dispatch({ type: 'saveMockAnswer', id: step.id, text })`.
- A live meter under it: **"About {n} of {budget} tokens"**, plus **"{k} over"** when over. It is a `role="meter"` with `aria-valuenow`, `aria-valuemax={budget}` and `aria-valuetext` equal to the visible text; over budget it takes the `--bad` colour and the text, not colour alone, says so.
- One muted line, exact copy: **"An estimate: about 4 characters per token. Real counts come from the model provider and differ, more so for code and non-English text."**
- "Grade my prompt" is disabled while the estimate is 0. Being over budget does not disable it.
- Grading shows the rubric as checkboxes (like the mock step) with one extra first line that is **not** a checkbox: "Fits the budget" with a ✓ or ✗ computed from the estimate. `onDone({ selfGrade: (ticked + (fits ? 1 : 0)) / (rubric.length + 1) })`.
- `CopyForReview` with `promptReviewPrompt`: gives the brief, the budget, the estimate, the draft and the rubric, and asks the reviewer to say what to cut and what is missing. Same "nothing is sent from this app" framing as the mock step.

- [ ] **Step 1: Failing tests** (fixture: brief 'Write a system prompt for a support assistant.', budget 100, rubric of 3 lines)

```tsx
test('the meter follows the text and reads "About 25 of 100 tokens" for 100 characters', ...);
test('over budget says how far over in words and still allows grading', ...);       // 480 chars → 'About 120 of 100 tokens' and '20 over'
test('an empty or whitespace-only prompt cannot be graded', ...);                    // button disabled; type '   ' → still disabled
test('the draft is saved as it is typed and restored when the step is shown again', ...); // loadProgress(storage).mockAnswers[id]
test('within budget with 2 of 3 rubric lines ticked → selfGrade 3/4', ...);
test('over budget with 3 of 3 ticked → selfGrade 3/4', ...);
test('"Fits the budget" is shown as a result, not a checkbox', ...);
test('a 20,000 character paste is accepted, counted as about 5000 tokens, and saved', ...); // use fireEvent.change, not userEvent.type
test('emoji and non-Latin text render a count without throwing', ...);
test('the review text contains the brief, the budget, the draft and every rubric line', ...); // promptReviewPrompt
```

- [ ] **Step 2:** Run `pnpm vitest run test/ui/PromptStep.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement; replace the temporary `StepView` case.
- [ ] **Step 4:** Run `pnpm test && pnpm tsc -b`. Expected: all pass.
- [ ] **Step 5:** Commit `feat(ui): prompt exercise with a live token estimate and budget-aware grading`.

### Task 3: Sandbox — a queue holds writes during failover, and the dashboard scenario

**Files:**
- Modify: `src/core/sandbox.ts`, `src/content/scenarios.ts`, `src/ui/steps/SandboxStep.tsx` (metric note only)
- Test: `test/core/sandbox.test.ts`

**Interfaces:**
- Produces: `SCENARIOS['dashboard-rush']`.

Engine rule (illustrative): when `load.dbDown` and `arch.queue > 0`, writes are not counted as failed; they wait in the queue until the primary is back. Without a queue they fail as today. Reads behave as today.

Scenario `dashboard-rush` (title "The Monday dashboard"): a reporting product. Start `app: 1, db: 1`. Palette `['replica', 'queue', 'app', 'lb']` (no cache: every dashboard query is different, and the story says so). Four events in this order:
1. "Normal traffic"
2. "Monday 9:00, everyone opens dashboards" — read-heavy spike
3. "Nightly data import" — write-heavy burst
4. "Primary fails during the Monday rush" — event 2's load with `dbDown: true`

Starting values to tune from: base `rps 400, readRatio 0.9`; rush `rps 2000, readRatio 0.95`; import `rps 1500, readRatio 0.2`; SLO `p95 300 ms, errors 1%`; budget `$400`. Intended solution: 3 read replicas and a queue. Lesson text explains: replicas multiply read capacity and keep reads alive when the primary dies; they do nothing for writes; the queue smooths the import and holds writes during failover; the cost is that replicas lag slightly behind the primary.

- [ ] **Step 1: Failing tests**

```ts
test('primary down, no queue: writes fail (unchanged)', ...);
test('primary down with a queue: writes wait instead of failing', ...);   // errorRate 0 with a replica + queue
test('slow-product-page and flash-sale still solve with their known answers', ...);
describe('dashboard-rush', () => {
  test('four events in the planned order; the last is the rush with the primary down', ...);
  test('the start architecture passes normal traffic and fails the rush', ...);
  test('three replicas without a queue pass the rush and fail the import', ...);
  test('a queue with two replicas fails the rush or the outage', ...);
  test('three replicas and a queue solve every event within budget', ...);
  test('adding a load balancer and a second app server to the solution is over budget', ...);
  test('the palette is replica, queue, app, lb', ...);
});
```

- [ ] **Step 2:** Run `pnpm vitest run test/core/sandbox.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. In `SandboxStep`, when the event has `dbDown` and the architecture has a queue, the metric note reads "Writes are waiting in the queue until the primary is back."
- [ ] **Step 4:** Run `pnpm test`. Expected: all pass.
- [ ] **Step 5:** Commit `feat(sandbox): queue holds writes during failover, dashboard-rush scenario`.

### Task 4: Unit 3 scaffold

**Files:**
- Create: `src/content/unit3.ts` (exports `unit3`, id `unit-3`, title `Unit 3: Data at scale`), `src/content/unit3/{design,practice,talk,extras}.ts`
- Modify: `src/content/index.ts` (`UNITS = [unit1, unit2, unit3]`), `src/ui/labels.ts`, `src/content/REVIEW.md` ("# Unit 3" heading)
- Test: create `test/content/unit3.test.ts`; modify `test/python/harness.test.ts` (expected problem ids), `test/core/session.test.ts`

**Interfaces:**
- Lesson ids, in order: `sql-vs-nosql`, `replication`, `sharding`, `consistency`, `dashboard-rush`, `talk-data-stores`, `hash-map`, `dotnet-async`, `ai-prompt-budget`, `mock-news-feed`, `story-tradeoff`.
- Topics and labels: `data-modelling` "Choosing a database", `replication` "Replication", `sharding` "Sharding", `consistency` "Consistency", `scaling-db` (existing), `talk-storage` "Tech talk: storage", `talk-search-analytics` "Tech talk: search and analytics", `hash-map` "Hash maps", `dotnet-async` ".NET async", `ai-prompts` "Writing prompts", `design-feed` "News feed", `behavioural` (existing).
- Pillars: lessons 1–5 and 10 `design`; 6 `talk`; 7 `algo`; 8 `stack`; 9 `ai`; 11 `stories`. Slots: 5 `practice`; 10 and 11 `extra`; the rest `lesson`.

- [ ] **Step 1: Failing tests**

```ts
// unit3.test.ts
test('unit 3 is the third unit and has its eleven lessons in the planned order', ...);
test('unit 3 has no bug-hunt lesson and no Angular', ...);
test('ids are unique across all units', ...);                       // validateContent(UNITS) toEqual([])
test('every unit 3 item uses a planned topic', ...);
test('pillars and slots are as planned', ...);
// session.test.ts
test('with Unit 2 half done, Unit 3 lessons are not offered and read "later"', ...);
test('the daily two can be the last lesson of Unit 2 and the first of Unit 3', ...);
```

- [ ] **Step 2:** Run `pnpm vitest run test/content test/core/session.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Create the scaffold with one placeholder explain step per lesson ("Coming soon."), as 2a did. A `no lesson is still a placeholder` test is added in Task 9.
- [ ] **Step 4:** Run `pnpm test && pnpm tsc -b`. Expected: all pass.
- [ ] **Step 5:** Commit `feat(content): Unit 3 scaffold`.

### Task 5: Design lessons — databases, replication, sharding, consistency

**Files:**
- Modify: `src/content/unit3/design.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/{DataShapes,ReplicationLag,ShardKeys,Quorum}.tsx`; register as `data-shapes`, `replication-lag`, `shard-keys`, `quorum`
- Test: `test/content/unit3.test.ts`, `test/ui/visuals.test.tsx`

Each lesson: one or two explain steps (first has the visual), then 4–5 quiz steps whose `why` says why the right option is right and why the most tempting wrong one is wrong.

- **`sql-vs-nosql`** (ids `db-*`). Must teach: a relational database gives joins, transactions and a fixed schema, and is the right default; document, key-value and wide-column stores trade those for easy horizontal scaling and flexible shape; the choice follows the **access patterns** (how the data is read and written), not fashion; "NoSQL" is several different things; many systems use both. Visual: one order shown as joined rows and as a single document, with two questions to press ("show this order with its items", "find every order containing product X") and how many lookups each shape needs.
- **`replication`** (ids `rep-*`). Must teach: one leader takes writes, followers copy them and serve reads; **asynchronous** replication is fast but followers lag and a failover can lose the last writes; **synchronous** is safe but slower and stalls if the follower is down; read-your-own-writes and how to get it (read from the leader for a short time after writing); failover and why two leaders at once (split brain) is dangerous. Visual: write a value, then read from the follower before and after the lag, with a sync/async switch.
- **`sharding`** (ids `shard-*`). Must teach: splitting one dataset across machines by a **shard key**; hash keys spread evenly but lose range queries; range keys keep ranges together but create hot spots; a bad key (country, or a celebrity's id) gives one overloaded shard; queries across shards and transactions across shards are expensive; adding a shard under "hash mod N" moves most keys, which is the problem consistent hashing reduces; shard late, after replicas and caching. Visual: twelve customers placed on three shards under "by country" and "by hash of id", showing the skew.
- **`consistency`** (ids `cons-*`). Must teach: strong consistency (every read sees the latest write) vs eventual (replicas converge, reads may be stale for a while); CAP stated correctly, that is, **during a network partition** a system either refuses some requests to stay consistent or answers with possibly stale data to stay available; quorum reads and writes, with R + W > N guaranteeing a read overlaps the latest write; which features need strong consistency (balances, stock, unique usernames) and which do not (like counts, feeds). Visual: three replicas with sliders for W and R, saying whether a read is guaranteed to see the latest write. Ends with **two bug steps**: a C# handler that writes through the primary context and immediately reads the same row from a read-replica context to build its response (`bug-read-after-write`); a Python function that reads a stock count, subtracts in memory and writes it back with no transaction or version check, losing an update under concurrency (`bug-lost-update`).

- [ ] **Step 1:** Add tests: each lesson opens with its visual and has ≥4 quizzes with `why` longer than 80 characters; `consistency` ends with exactly two bug steps in `csharp` then `python`; each visual renders and its control changes what is shown (assert the specific stat or sentence each visual reports, as `visuals.test.tsx` does for Unit 2).
- [ ] **Step 2:** Run `pnpm vitest run test/content test/ui/visuals.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write content and visuals.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Add each explain and item to `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): Unit 3 databases, replication, sharding, consistency`.

### Task 6: Sandbox lesson and the hash-map problem

**Files:**
- Modify: `src/content/unit3/practice.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/HashLookup.tsx` (key `hash-lookup`)
- Test: `test/content/unit3.test.ts`, `test/ui/visuals.test.tsx`, `test/python/harness.test.ts`

- **`dashboard-rush`**: one explain step (reads vs writes need different fixes; what a queue does during failover), then `{ kind: 'sandbox', id: 'sandbox-dashboard-rush', topic: 'scaling-db', scenarioId: 'dashboard-rush' }`.
- **`hash-map`**: explain with the visual (walk an unsorted list once, asking "have I already seen the number that completes this one?"); 3 quizzes `hm-which-*` (one where a hash map is right, one where a set is enough, one where sorting plus two pointers is better because extra memory is not allowed); python step `py-two-sum`, `fn: 'two_sum'`, signature `two_sum(nums, target)` on an **unsorted** list returning `[i, j]` with `i < j` and `nums[i] + nums[j] == target`, or `None`. Each test has at most one valid pair. At least 7 tests including duplicates (`[3, 3], 6 → [0, 1]`), negatives, a number that would pair with itself only (`[5], 10 → None`, `[5, 1], 10 → None`), and an empty list. Walkthrough of at least 8 frames. Starter returns `None`.

- [ ] **Step 1:** Tests: the sandbox step points at `dashboard-rush`; the python step has ≥7 tests and ≥8 frames; `harness.test.ts` expects problem ids `['py-pair-with-sum', 'py-max-window-sum', 'py-two-sum']` (its existing loops then run the reference and the starter under CPython); the visual steps forward and reports a found pair.
- [ ] **Step 2:** Run `pnpm vitest run test/content test/python test/ui/visuals.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write content and the visual.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): dashboard sandbox lesson, hash-map pattern`.

### Task 7: Tech talk deck — data stores

**Files:**
- Modify: `src/content/unit3/talk.ts`, `src/content/REVIEW.md`
- Test: `test/content/unit3.test.ts`

**`talk-data-stores`**: one short explain step, then 9 cards with ids `tt-*`.
- Topic `talk-storage` (5): Redis as a cache vs as a data store (persistence and eviction); document database; object storage for files and why files do not go in the database; wide-column store; time-series database.
- Topic `talk-search-analytics` (4): search engine and the inverted index; OLTP vs OLAP and column storage; vector search and embeddings; change data capture.

- [ ] **Step 1:** Tests, as for the Unit 2 decks: exactly 9 cards split 5 and 4; ids prefixed `tt-`; ≥3 options; `why` > 80 characters; `lookUp` present and unique across Units 2 and 3; correct answers spread over at least 3 positions.
- [ ] **Step 2:** Run `pnpm vitest run test/content`. Expected: FAIL.
- [ ] **Step 3:** Write the cards.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): tech talk deck for data stores`.

### Task 8: .NET async lesson

**Files:**
- Modify: `src/content/unit3/extras.ts`, `src/content/REVIEW.md`
- Create: `src/ui/visuals/AwaitThreads.tsx` (key `await-threads`)
- Test: `test/content/unit3.test.ts`, `test/ui/visuals.test.tsx`

**`dotnet-async`** (ids `net-*`). Must teach, accurately:
- `await` on I/O does not hold a thread; the method is suspended and its thread goes back to the pool until the I/O completes. The compiler turns the method into a state machine.
- Blocking on async code with `.Result` or `.Wait()` keeps a pool thread busy doing nothing. In ASP.NET Core this causes **thread-pool starvation** under load. The classic **deadlock** from `.Result` happens where a synchronisation context exists (UI apps, classic ASP.NET); ASP.NET Core has none. State both, and do not call the ASP.NET Core case a deadlock.
- "Async all the way": one blocking call in the chain undoes the benefit.
- `Task.WhenAll` runs independent calls concurrently; awaiting them one after another is sequential.
- `ConfigureAwait(false)` matters in library code that may run under a synchronisation context; it changes nothing in ASP.NET Core application code.
- Pass a `CancellationToken` so abandoned requests stop working.

Visual: a pool of four threads and eight requests that each wait one second on I/O, with a blocking/async switch showing how many are in progress and how long all eight take. Four quizzes, then one C# bug step `bug-sync-over-async`: a controller action that calls an async repository method with `.Result`.

- [ ] **Step 1:** Tests: opens with the visual; exactly 4 quizzes and 1 `csharp` bug step last; the `why` of `bug-sync-over-async` matches `/starv/i`, and no sentence in the lesson that contains "ASP.NET Core" says it deadlocks (split the lesson text on `.` and assert none matches both `/ASP\.NET Core/` and `/deadlocks?\b/i` without also matching `/\bno\b|\bnot\b|n't/i`); the visual's switch changes the reported total time.
- [ ] **Step 2:** Run `pnpm vitest run test/content test/ui/visuals.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write content and the visual.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): .NET async lesson`.

### Task 9: Prompt-budget lesson, news-feed mock, trade-off story

**Files:**
- Modify: `src/content/unit3/extras.ts`, `src/content/REVIEW.md`
- Test: `test/content/unit3.test.ts`

- **`ai-prompt-budget`** (pillar `ai`, topic `ai-prompts`). One explain step with no visual required (the exercise is the interactive part): what a prompt needs (who the model is answering as and for whom, the task, the facts it may use, what to do when the answer is not in those facts, the output format); what to cut first (background not needed for this task, repetition, long examples); why a budget exists (cost on every request, and room left for the conversation). Two quizzes (`ai-prm-*`). Then the prompt step:
  - `id: 'prompt-support-reply'`, `budget: 350`.
  - `brief`: you are building an assistant that drafts replies to customer emails about refunds for an online shop; write the system prompt; it must fit in about 350 tokens.
  - `material`: invented internal policy notes for a fictional shop, written by the builder, estimated at 600–900 tokens, mixing what matters (refund window, who approves exceptions, what must never be promised, when to hand over to a person) with plausible noise (company history, office hours, unrelated shipping detail, repeated points). Fictional names only.
  - `rubric` (exactly these six):
    1. Says who the assistant is replying as, and to whom
    2. States the task in one or two sentences
    3. Includes the policy facts a reply needs, and leaves the rest out
    4. Says what to do when the answer is not in those facts: hand over to a person, never guess
    5. Specifies the reply's length, tone and format
    6. No repeated instructions or filler
- **`mock-news-feed`**: mock step `mock-feed`, topic `design-feed`. Prompt: design the home feed for a social app, where users follow others and see their recent posts. Five follow-ups covering: read/write volume and what it implies; building the feed when a post is written vs when the feed is read; an account with ten million followers; paging through the feed while new posts arrive; how stale a feed may be and where replicas or caches are acceptable. Rubric of 6–8 lines that reward using Unit 3's ideas by name (replication lag, shard key, eventual consistency) plus cursor pagination from Unit 2.
- **`story-tradeoff`**: story step `story-argued-tradeoff`, topic `behavioural`. Prompt: a time you argued for a technical trade-off and what happened. At least three generic hints (the options, what you gave up, how you made the case, what you would do now).

- [ ] **Step 1:** Tests: `ai-prompt-budget` ends with the prompt step, budget 350, the six rubric lines, and `estimateTokens(material)` between 600 and 900; the lesson passes the same no-stale-facts regex as `ai-tokens`; the mock has 5 follow-ups and a 6–8 line rubric mentioning replication or consistency; the story has ≥3 hints; no lesson in Unit 3 contains "Coming soon"; `grep -rn "test.todo" test` prints nothing.
- [ ] **Step 2:** Run `pnpm vitest run test/content`. Expected: FAIL.
- [ ] **Step 3:** Write the content. Check the AI explain step against current Anthropic documentation before writing, as in 2a.
- [ ] **Step 4:** Run `pnpm test`. Expected: PASS. Update `REVIEW.md`.
- [ ] **Step 5:** Commit `feat(content): prompt-budget lesson, news-feed mock, trade-off story`.

### Task 10: Play it through, then whole-branch review

**Files:** none planned; fixes found here get a failing test first where a test can see them.

- [ ] **Step 1:** `pnpm test && pnpm tsc -b && pnpm build`. Expected: all pass.
- [ ] **Step 2:** Start the `dev` server. With stored progress that has Units 1 and 2 complete on earlier dates, at phone width in dark mode, play every Unit 3 lesson, moving `?today=` forward as needed:
  - each of the six new visuals responds to its control;
  - the dashboard sandbox is solvable, and with a queue the outage event shows the waiting-writes note;
  - `two_sum` passes with the reference solution in the in-browser Python and does not pass with the starter;
  - the prompt exercise: paste the material and see the over-budget state in words; write a short prompt and see it within budget; reload and see the draft restored; grade it and see "Fits the budget" computed; "Copy for AI review" copies text;
  - the mock saves and grades; the story renders.
- [ ] **Step 3:** Check Home in light mode: Unit 3 on the trail, the new bars under their pillars.
- [ ] **Step 4:** Read `REVIEW.md`'s Unit 3 section against the content files: every explain and item is listed.
- [ ] **Step 5:** Whole-branch review by a fresh reviewer against both specs and this plan's Review Focus; fix Critical and Important findings test-first; commit.
- [ ] **Step 6:** Report to the owner what was verified and what was not. Do not merge or push until they say so.
