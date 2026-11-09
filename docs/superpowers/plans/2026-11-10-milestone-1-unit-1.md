# Interview Quest, Milestone 1: skeleton + Unit 1 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A React web app (installable as a PWA) where Unit 1 can be played end to end across all pillars: review queue, lessons, a Python problem, a sandbox scenario, bug cards, a stack question, a scripted mock interview and a private story. Progress, streak and readiness persist locally.

**Architecture:** A static Vite + React + TypeScript single-page app with no backend. Pure logic lives in `src/core/` (spaced repetition, streak, readiness, daily session, sandbox simulation) and is unit-tested with Vitest. Content is typed TypeScript data validated with zod. Progress lives in `localStorage` behind one store module. Python runs in a Pyodide web worker.

**Tech Stack:** pnpm, Vite 5, React 18, TypeScript (strict), react-router-dom 6 (HashRouter, for GitHub Pages), zod 3, @xyflow/react 12 (sandbox), @uiw/react-codemirror + @codemirror/lang-python (editor), prism-react-renderer 2 (snippet highlighting), Pyodide 0.26.4 loaded from `https://cdn.jsdelivr.net/pyodide/v0.26.4/full/`, vite-plugin-pwa, Vitest + @testing-library/react + jsdom. These versions or newer compatible ones.

**Spec:** `docs/superpowers/specs/2026-11-10-interview-quest-design.md`

## Global Constraints

- Free only: no paid services, no runtime AI, no backend, no accounts.
- TypeScript `strict: true`.
- Spaced repetition intervals **1 → 3 → 7 → 14 → 30 days**. Correct moves an item up a box; a miss sends it to box 1 (index 0). **Learned** = passed the 14-day review.
- Readiness: auto-checked work counts fully; rubric self-grades count at **0.5** weight. Readiness never grows from time spent.
- Algorithm solving: **Python only**. Bug cards: mostly C# and TypeScript, some Python.
- Stories are written by the user and saved only in browser storage and the export file. They are **never in the repo**.
- No timers or lives as a core mechanic. The tone is calm and encouraging (use the frontend-design skill for the look).
- Every `localStorage` access is wrapped in try/catch; the app works without storage.
- Layout works at 375 px width with a 16 px gutter, and in light and dark mode.

## Review Focus

1. **User Python that loops forever or throws:** the run stops after 5 s with a readable error, and the page stays responsive (Task 6).
2. **Corrupted or blocked storage, or a malformed import file:** the app starts with fresh progress, and a bad import is rejected without overwriting existing progress (Task 4).
3. **Days skipped:** the streak resets correctly by local calendar day. The review queue after a long absence is capped at 15 items, most overdue first (Tasks 2, 5).
4. **The same item answered twice in a day** (a lesson replayed, or a card in both review and lesson): the box advances at most once per item per day (Task 2).
5. **Content changes that rename or remove item ids:** stale progress entries are ignored, not crashes, and don't count toward readiness (Tasks 3, 5).

---

## File Structure

```
src/
  core/dates.ts        dayKey, addDays, daysBetween (local calendar days)
  core/srs.ts          Leitner boxes
  core/streak.ts       daily streak
  core/readiness.ts    per-topic readiness from progress + content
  core/session.ts      builds today's session
  core/sandbox.ts      architecture → metrics simulation
  content/types.ts     zod schemas + inferred types for units/lessons/steps
  content/unit1.ts     Unit 1 content
  content/index.ts     all units, item index, topic list
  content/REVIEW.md    checklist for the owner's correctness review
  state/progress.ts    Progress type, load/save, export/import
  state/useProgress.tsx React context + hooks wrapping progress.ts
  python/harness.ts    builds the Python test harness source
  python/worker.ts     Pyodide web worker
  python/runPython.ts  runTests() with timeout
  ui/                  screens and step renderers (Tasks 7–11)
  styles/tokens.css    color/spacing tokens, light + dark
test/                  *.test.ts(x) mirroring src/
```

---

### Task 1: Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `.gitignore`, `README.md`, `test/App.test.tsx`

**Interfaces:**
- Produces: `App` with HashRouter routes `/` (Home), `/lesson/:lessonId`, `/review`, `/stories`, `/settings`, each a placeholder for now. A nav bar with Today / Review / Stories / Settings.

- [ ] **Step 1:** Create a Vite React-TS project with pnpm in the repo root (keep `docs/`). Add Vitest with jsdom and @testing-library/react. `pnpm test` runs `vitest run`.
- [ ] **Step 2: Write the failing test** `test/App.test.tsx`: rendering `<App />` shows nav links named "Today", "Review", "Stories", "Settings".
- [ ] **Step 3:** Run `pnpm test`. Expected: FAIL.
- [ ] **Step 4:** Implement the routes and nav. Use the frontend-design skill to set the tokens in `tokens.css`: a calm, encouraging palette defined on `:root`, a dark theme under `@media (prefers-color-scheme: dark)`, an explicit `body` background, and a 16 px gutter.
- [ ] **Step 5:** Run `pnpm test` and `pnpm build`. Expected: PASS, build succeeds.
- [ ] **Step 6:** Commit `chore: scaffold Vite React app`.

---

### Task 2: Dates, spaced repetition, streak

**Files:**
- Create: `src/core/dates.ts`, `src/core/srs.ts`, `src/core/streak.ts`
- Test: `test/core/srs.test.ts`, `test/core/streak.test.ts`, `test/core/dates.test.ts`

**Interfaces:**
- Produces:
  - `type DayKey = string` (`YYYY-MM-DD`, local time); `dayKey(d: Date): DayKey`; `addDays(k: DayKey, n: number): DayKey`; `daysBetween(a: DayKey, b: DayKey): number`
  - `INTERVALS = [1, 3, 7, 14, 30] as const`
  - `type SrsItem = { id: string; box: 0|1|2|3|4; due: DayKey; lastAnswered: DayKey }`
  - `review(prev: SrsItem | undefined, id: string, correct: boolean, today: DayKey): SrsItem`
  - `isDue(item: SrsItem, today: DayKey): boolean`; `isLearned(item: SrsItem): boolean`
  - `dueQueue(items: SrsItem[], today: DayKey, cap = 15): SrsItem[]`
  - `type Streak = { current: number; best: number; lastDay: DayKey | null }`; `recordActivity(s: Streak, today: DayKey): Streak`

Rules: the first answer (right or wrong) puts the item in box 0. A later correct answer **on or after `due`** moves the box to min(box+1, 4); a correct answer before `due` (including a second answer on the same day) leaves box and due unchanged and only updates `lastAnswered`. A miss always resets to box 0. `due = addDays(today, INTERVALS[box])` whenever the box is set. Learned = box 4 (it reached box 4 only by passing the box-3, 14-day review).

- [ ] **Step 1: Write the failing tests**
  - `review(undefined,'a',true,'2026-11-10')` → `{box:0, due:'2026-11-11'}`
  - a correct answer chain on due dates goes box 1 due +3 → box 2 due +7 → box 3 due +14 → box 4 due +30; `isLearned` is false at box 3 and true at box 4
  - a miss at box 3 → box 0, due +1
  - two correct answers on the same day advance once (box stays at the first result)
  - `dueQueue` with 20 overdue items returns 15, sorted by `due` ascending; items not yet due are excluded
  - `addDays('2026-12-31',1) === '2027-01-01'`; `daysBetween('2026-03-28','2026-03-30') === 2` (spans a DST change)
  - streak: same day → unchanged; next day → current+1; a 2-day gap → current 1; `best` keeps the maximum
- [ ] **Step 2:** Run `pnpm test test/core`. Expected: FAIL.
- [ ] **Step 3:** Implement. `dayKey` uses local `getFullYear/getMonth/getDate`. Date math parses keys as UTC noon to avoid DST drift.
- [ ] **Step 4:** Run `pnpm test test/core`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(core): spaced repetition and streak`.

---

### Task 3: Content schema and readiness

**Files:**
- Create: `src/content/types.ts`, `src/content/index.ts`, `src/core/readiness.ts`
- Test: `test/content/types.test.ts`, `test/core/readiness.test.ts`

**Interfaces:**
- Produces (zod schemas, plus `z.infer` types of the same name):
  - `Pillar = 'design'|'review'|'algo'|'stack'|'stories'`
  - `Step` = discriminated union on `kind`:
    - `explain {kind, title, body: string (markdown), visual?: string}`. `visual` is a key into the visuals registry (Task 7).
    - `quiz {kind, id, topic, prompt, options: string[], answer: number, why}`
    - `bug {kind, id, topic, lang:'csharp'|'typescript'|'python', code, bugLines: number[], options: string[], answer: number, why, fix}`
    - `python {kind, id, topic, prompt, fn, starter, tests: {args: unknown[], expected: unknown}[], walkthrough: {line: number, vars: Record<string,string>, note: string}[], reference}`
    - `sandbox {kind, id, topic, scenarioId}`
    - `mock {kind, id, topic, prompt, followUps: string[], rubric: string[]}`
    - `story {kind, id, topic, prompt, hints: string[]}`
  - `Lesson {id, title, pillar, slot: 'lesson'|'practice'|'extra', steps: Step[]}`; `Unit {id, title, lessons: Lesson[]}`
  - In `index.ts`: `UNITS: Unit[]`, `ITEMS: Map<string, {step: Step; lessonId: string}>` (every step with an `id`), `TOPICS: string[]`. A function `validateContent(units: Unit[]): string[]` returns errors for duplicate ids, `answer` out of range, and `bugLines` outside the code's line count.
  - `readiness(topic: string, progress: Pick<Progress,'srs'|'selfGrades'|'completed'>): number` (0..1)
- Consumes: `SrsItem` (Task 2). `Progress` field names are defined in Task 4; define the `Pick` shape locally here and import it from Task 4 once it exists.

Readiness rule: over the items whose `topic` matches, auto items (`quiz`, `bug`, `python`, `sandbox`) earn `box/4`, or 0 if never answered correctly; self items (`mock`, `story`) earn `0.5 * selfGrade` (selfGrade 0..1 = fraction of rubric checked). Every item's max is 1. Readiness = earned / item count. Progress ids not in `ITEMS` are ignored.

- [ ] **Step 1: Write the failing tests**
  - `validateContent` flags a duplicate id, `answer: 5` with 3 options, and `bugLines: [20]` on a 10-line snippet
  - readiness with 2 auto items at box 4 and box 2 → 0.75
  - one mock fully self-graded (1.0) plus one auto item at box 4 → 0.75
  - a progress entry for unknown id `'gone'` doesn't change the result and doesn't throw
  - a topic with no progress → 0
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement (with an empty `UNITS` for now; Task 12 fills it).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(core): content schema and readiness`.

---

### Task 4: Progress store

**Files:**
- Create: `src/state/progress.ts`, `src/state/useProgress.tsx`
- Test: `test/state/progress.test.ts`

**Interfaces:**
- Produces:
  - `type Progress = { version: 1; srs: Record<string, SrsItem>; selfGrades: Record<string, number>; completed: Record<string, DayKey>; streak: Streak; stories: Record<string, {situation: string; task: string; action: string; result: string}>; mockAnswers: Record<string, string> }`
  - `emptyProgress(): Progress`; `loadProgress(storage?: Storage): Progress`; `saveProgress(p: Progress, storage?: Storage): void`
  - `exportProgress(p: Progress): string` (pretty JSON); `importProgress(json: string): {ok: true; progress: Progress} | {ok: false; error: string}`, validated by a zod `ProgressSchema`
  - Reducer actions: `answer(itemId, correct, today)`, which updates srs and calls `recordActivity`; `selfGrade(itemId, score, today)`; `completeLesson(lessonId, today)`; `saveStory(id, star)`; `saveMockAnswer(id, text)`; `replace(progress)`
  - `ProgressProvider`, `useProgress(): {progress, dispatch, today}`. It saves on every change. `today` is `dayKey(new Date())`; in dev builds only (`import.meta.env.DEV`), a `?today=YYYY-MM-DD` query param overrides it for testing.
- Storage key: `iq.progress.v1`.

- [ ] **Step 1: Write the failing tests** (using a fake `Storage`)
  - storage holding `"{not json"` → `loadProgress` returns `emptyProgress()`
  - a storage whose `getItem`/`setItem` throw → load returns empty, save doesn't throw
  - export → import round trip gives an equal object
  - `importProgress('{"version":2}')` → `{ok:false}`; the caller's existing progress is untouched (the test asserts the store's state after a failed import dispatch)
  - the `answer` action records srs and bumps the streak
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(state): local progress with export/import`.

---

### Task 5: Daily session builder

**Files:**
- Create: `src/core/session.ts`
- Test: `test/core/session.test.ts`

**Interfaces:**
- Consumes: `dueQueue`, `ITEMS`, `UNITS`, `Progress`.
- Produces: `type DailySession = { review: string[]; lesson?: string; practice?: string; extras: string[] }`, and `buildSession(units: Unit[], progress: Progress, today: DayKey): DailySession`.

Rules:
- `review` = `dueQueue` ids that exist in `ITEMS` and are reviewable (`quiz`, `bug`), cap 15.
- `lesson` / `practice` = the first lesson in path order (units, then lessons) with that slot that isn't completed. Also any lesson completed *today*, so the session stays stable after finishing it.
- `extras` = all not-yet-completed `extra` lessons in the current unit (the unit containing the next `lesson`).

- [ ] **Step 1: Write the failing tests** using a small fixture unit (2 lessons, 1 practice, 2 extras)
  - fresh progress → the first lesson, the first practice, both extras, empty review
  - lesson 1 completed yesterday → lesson 2
  - an srs entry for an unknown id is not in `review`
  - all done → `lesson` and `practice` undefined (the Home screen shows "Unit complete")
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(core): daily session`.

---

### Task 6: Python runner

**Files:**
- Create: `src/python/harness.ts`, `src/python/worker.ts`, `src/python/runPython.ts`
- Test: `test/python/harness.test.ts`

**Interfaces:**
- Produces:
  - `buildHarness(userCode: string, fn: string, tests: {args: unknown[]; expected: unknown}[]): string`. This is Python source that runs the user code, calls `fn(*args)` per test inside try/except, compares with `==`, and prints exactly one JSON line `{"results":[{"ok":bool,"got":repr|null,"error":str|null}]}`. Args and expected are embedded via `json.loads` of a JSON string literal, never string-interpolated code.
  - `runTests(userCode, fn, tests, timeoutMs = 5000): Promise<{ status: 'done'; results: {ok: boolean; got: string|null; error: string|null}[] } | { status: 'timeout' } | { status: 'error'; message: string }>`. On timeout it terminates the worker and the next call spawns a fresh one (Pyodide reloads from the HTTP cache).

- [ ] **Step 1: Write the failing tests** for `buildHarness`
  - the output contains `def` from the user code verbatim and the `fn` name
  - test args containing quotes and newlines (`["a\"b\nc"]`) are embedded only inside a `json.loads('...')` literal that round-trips (assert `JSON.parse` of the extracted literal equals the args)
  - the output ends by printing a single JSON line
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the harness, the worker (`importScripts` of the pinned Pyodide URL, `runPython`, capture stdout, post the message) and `runTests` (worker via `new Worker(new URL('./worker.ts', import.meta.url), {type:'classic'})`, plus a timeout).
- [ ] **Step 4:** Run. Expected: PASS. Then a manual browser check in Task 13 covers real execution, including `while True: pass` → `timeout`.
- [ ] **Step 5:** Commit `feat(python): in-browser test runner`.

---

### Task 7: Lesson player, explain/quiz/bug steps

**Files:**
- Create: `src/ui/LessonScreen.tsx`, `src/ui/steps/ExplainStep.tsx`, `src/ui/steps/QuizStep.tsx`, `src/ui/steps/BugStep.tsx`, `src/ui/visuals/index.tsx` (registry `VISUALS: Record<string, React.FC>`), `src/ui/visuals/CacheFlow.tsx`, `src/ui/visuals/TwoPointers.tsx`, `src/ui/visuals/DesignFlow.tsx`
- Test: `test/ui/QuizStep.test.tsx`, `test/ui/BugStep.test.tsx`, `test/ui/LessonScreen.test.tsx`

**Interfaces:**
- Consumes: `useProgress` (Task 4), `ITEMS`/`UNITS` (Task 3).
- Produces: a step component contract `type StepProps<S> = { step: S; onDone: (result?: {correct?: boolean; selfGrade?: number}) => void }`. `LessonScreen` walks the steps, dispatches `answer`/`selfGrade` from results, and calls `completeLesson` at the end, then shows a "lesson complete" card with the topics' readiness changes. `ReviewScreen` (Task 11) reuses `QuizStep`/`BugStep`.

Behaviour: a quiz shows the options; after picking, it reveals right/wrong plus `why`, then a Continue button. A bug card renders the code with line numbers (prism-react-renderer). Tapping a line marks it. "Check" grades correct only if the tapped line is in `bugLines` **and** the chosen option equals `answer`. Then it reveals `why` and `fix`. Visuals are small animated SVG/CSS diagrams that explain the concept (requests hitting cache vs DB; two pointers moving inward; the 5-step flow).

- [ ] **Step 1: Write the failing tests**
  - a quiz with the wrong option → `onDone({correct:false})` after Continue; `why` text is visible
  - a bug card with the right line + right option → `{correct:true}`; the right option + wrong line → `{correct:false}`
  - `LessonScreen` for a fixture lesson completes and the store has `completed[lessonId] === today`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): lesson player with quiz and bug steps`.

---

### Task 8: Python step with walkthrough

**Files:**
- Create: `src/ui/steps/PythonStep.tsx`, `src/ui/steps/Walkthrough.tsx`
- Test: `test/ui/PythonStep.test.tsx` (mock `runTests`)

**Interfaces:**
- Consumes: `runTests` (Task 6), `StepProps` (Task 7).

Behaviour: a CodeMirror Python editor prefilled with `starter`; "Run tests" shows per-test ✓/✗ with got/expected/error; a "Loading Python…" state on first run; a timeout message "Stopped after 5 s — check for an infinite loop." When all pass, or after "Show walkthrough" (allowed any time, which counts as `correct:false`), `Walkthrough` steps through `reference` with prev/next, highlighting `line` and showing the `vars` table and `note`. Continue → `onDone({correct: allPassedWithoutWalkthroughFirst})`.

- [ ] **Step 1: Write the failing tests:** mocked all-pass → the walkthrough unlocks and `onDone({correct:true})`; a mocked `{status:'timeout'}` → the timeout message is shown; "Show walkthrough" before passing → `onDone({correct:false})`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): python step with walkthrough`.

---

### Task 9: Sandbox simulation and step

**Files:**
- Create: `src/core/sandbox.ts`, `src/content/scenarios.ts`, `src/ui/steps/SandboxStep.tsx`
- Test: `test/core/sandbox.test.ts`

**Interfaces:**
- Produces:
  - `type ComponentKind = 'cdn'|'lb'|'app'|'cache'|'queue'|'db'|'replica'`
  - `type Architecture = Record<ComponentKind, number>` (count per kind; `app` ≥ 1, `db` = 1)
  - `type Load = { rps: number; readRatio: number; staticRatio: number; dbDown?: boolean }`
  - `type Metrics = { p95Ms: number; errorRate: number; monthlyCost: number; bottleneck: ComponentKind | null; tiers: {kind: ComponentKind; load: number; capacity: number}[] }`
  - `simulate(arch: Architecture, load: Load): Metrics`
  - `type Scenario = { id; title; story: string; start: Architecture; palette: ComponentKind[]; baseLoad: Load; events: {label: string; load: Partial<Load>}[]; slo: {p95Ms: number; errorRate: number; budget: number}; lesson: string }`
  - `COMPONENTS: Record<ComponentKind, {label: string; capacityRps: number; baseMs: number; monthlyCost: number}>` in `scenarios.ts`.

Simulation model (illustrative numbers, not real benchmarks; the UI says so):
```
static = rps*staticRatio served by cdn if cdn>0 else goes to app
appLoad = rps - (cdn ? static : 0)
cacheHit = cache>0 ? 0.8 : 0                         // of reads
reads = appLoad*readRatio*(1-cacheHit); writes = appLoad*(1-readRatio)
writes reaching db = queue>0 ? min(writes, dbCap*0.5) : writes   // queue smooths writes
dbReadCap = dbCap*(1 + replica)   // replicas add read capacity; if dbDown and replica>0 → reads on replicas only, writes fail; if dbDown and no replica → all db traffic fails
per tier: u = load/capacity; latency = baseMs / max(1-u, 0.05); dropped = max(0, load-capacity)
p95Ms = sum of tier latencies on the request path × 2
errorRate = total dropped (+failed) / rps, clamped 0..1
bottleneck = tier with highest u if u ≥ 0.85 else null
monthlyCost = Σ count × monthlyCost
```

SandboxStep: a React Flow diagram rendered from `Architecture` (nodes laid out left-to-right in path order, count shown on the node). Palette buttons add/remove a component (within `palette`). The event buttons apply `events[i].load` over `baseLoad`. A metrics panel shows each metric against the SLO with green/red, plus the bottleneck node highlighted. The step is passed when every event's metrics meet the SLO within budget → `onDone({correct:true})`. An "I'm stuck" hint reveals `lesson`, and Continue is then allowed with `correct:false`.

- [ ] **Step 1: Write the failing tests**
  - 1 app + 1 db at a low rps → errorRate 0, bottleneck null
  - a 10× spike on the same → the db (or app) bottleneck, errorRate > 0
  - adding a cache at the same spike → the db load drops by 80% of reads, and errorRate falls below the uncached value
  - `dbDown` with 0 replicas → errorRate ≥ the db-bound share; with 1 replica, reads succeed
  - cost = Σ counts × the component costs
  - the Unit 1 scenario (Task 12) fails its SLO on the spike event with `start`, and passes with `start + cache` (keeps content solvable)
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the simulation, then the step UI.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: chaos sandbox`.

---

### Task 10: Mock interview and story steps, Stories screen

**Files:**
- Create: `src/ui/steps/MockStep.tsx`, `src/ui/steps/StoryStep.tsx`, `src/ui/StoriesScreen.tsx`
- Test: `test/ui/MockStep.test.tsx`, `test/ui/StoryStep.test.tsx`

**Interfaces:**
- Consumes: `saveMockAnswer`, `saveStory`, `selfGrade` actions (Task 4); `StepProps`.

Behaviour:
- **Mock:** shows `prompt` and a textarea. "Next question" reveals `followUps` one at a time, each with its own textarea appended to the same answer. Then a rubric checklist; "Finish" → `onDone({selfGrade: checked/rubric.length})`. The answer text is autosaved via `saveMockAnswer`.
- **Story:** four STAR textareas with `hints`, autosaved via `saveStory`. A self-check rubric: has a number/result, says "I" not just "we", under 2 minutes to say (word count ≤ 300 shown live) → `selfGrade`. The screen notes "Saved only on this device."
- **StoriesScreen:** lists the saved stories for editing.

- [ ] **Step 1: Write the failing tests:** a mock with 3 rubric items, 2 checked → `onDone({selfGrade: 2/3})`; story typing persists to the store under the step id; the word counter updates.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): mock interview and stories`.

---

### Task 11: Home, Review and Settings screens

**Files:**
- Create: `src/ui/HomeScreen.tsx`, `src/ui/ReviewScreen.tsx`, `src/ui/SettingsScreen.tsx`, `src/ui/ReadinessMap.tsx`
- Modify: `src/App.tsx` (wire the routes)
- Test: `test/ui/HomeScreen.test.tsx`, `test/ui/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: `buildSession` (Task 5), `readiness`, `TOPICS` (Task 3), `exportProgress`/`importProgress` (Task 4), `QuizStep`/`BugStep` (Task 7).

Behaviour:
- **Home:** the streak (current/best), today's session as a path of cards (Review N items → Lesson → Practice → Extras), done items ticked, and the Unit path below showing all lessons with done/next/locked states. Plus a `ReadinessMap`: one bar per topic grouped by pillar, labelled "learned"/"in progress" honestly.
- **Review:** plays the `review` queue with Quiz/Bug steps, dispatching `answer`.
- **Settings:** "Export progress" downloads `interview-quest-progress-YYYY-MM-DD.json`; "Import" reads a file, shows the error on failure, and asks for confirmation before replacing.

- [ ] **Step 1: Write the failing tests:** Home with fresh progress shows the first lesson's title as "next" and "0 day streak"; Settings import with invalid JSON shows the error and the store is unchanged.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement (frontend-design skill for layout; check 375 px width).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): home, review, settings`.

---

### Task 12: Unit 1 content

**Files:**
- Create: `src/content/unit1.ts`, `src/content/REVIEW.md`
- Modify: `src/content/index.ts` (`UNITS = [unit1]`), `src/content/scenarios.ts` (scenario `slow-product-page`)
- Test: `test/content/unit1.test.ts`

**Unit 1 "Foundations"**, in path order:
1. `design-flow` (lesson, design): the 5-step answer flow, explained with the `DesignFlow` visual, plus 4 quizzes.
2. `caching` (lesson, design): cache-aside, TTL, invalidation, stampede, with the `CacheFlow` visual and 5 quizzes.
3. `slow-product-page` (practice, design): a sandbox. Start: 1 app + 1 db. Events: normal traffic, 10× spike, DB primary down. Palette: app, cache, replica, cdn. Solvable with cache + replica within budget.
4. `two-pointers` (lesson, algo): the pattern explained with the `TwoPointers` visual; 3 "which pattern?" quizzes; a Python problem `pair_with_sum(nums, target)` on a sorted list returning indices or `None`, with ≥ 6 tests (empty, no pair, duplicates, negatives) and an 8-frame walkthrough.
5. `bug-hunt-1` (practice, review): 5 bug cards, one each of C# `async void` handler swallowing exceptions; C# EF Core N+1 in a loop; TS React `useEffect` stale closure / missing dependency; TS unsubscribed Angular `subscribe` in a component; Python SQL built with an f-string (injection).
6. `sql-indexes` (extra, stack): 4 quizzes on composite index column order, a function on an indexed column, covering index, index vs write cost.
7. `mock-url-shortener` (extra, design): a mock with prompt, 4 follow-ups (scale/estimates, ID generation and collisions, redirect latency/caching, analytics without slowing redirects) and a 6-item rubric (requirements, estimates, API, data model, scaling, trade-offs).
8. `story-built-system` (extra, stories): a story prompt "Tell me about a system you built and are proud of," with hints pointing at gateway/API/mobile work.

Topics: `design-flow`, `caching`, `scaling-db`, `two-pointers`, `async`, `data-access`, `frontend-state`, `security`, `sql-indexing`, `behavioural`.

- [ ] **Step 1: Write the failing test:** `validateContent(UNITS)` returns `[]`; Unit 1 has 8 lessons covering the pillars `design`, `algo`, `review`, `stack`, `stories`; each bug-card language appears at least once; every `explain.visual` key exists in `VISUALS`; every walkthrough `line` is within the `reference` line count. (That each `reference` passes its own tests is checked in the browser in Task 13, Step 2.)
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Write the content. Explanations are short and concrete and say *why it bites in production*. All code is original. `REVIEW.md` lists every item id with a checkbox for the owner's correctness review.
- [ ] **Step 4:** Run. Expected: PASS, and the Task 9 scenario-solvability test passes.
- [ ] **Step 5:** Commit `content: unit 1 foundations`.

---

### Task 13: PWA, deploy, end-to-end check

**Files:**
- Modify: `vite.config.ts` (vite-plugin-pwa: name "Interview Quest", icons, `base: '/interview-quest/'` for Pages)
- Create: `public/icon-192.png`, `public/icon-512.png`, `.github/workflows/deploy.yml` (build + deploy to GitHub Pages on push to `main`)
- Modify: `README.md` (run, test, deploy, "progress lives in your browser; export to move devices")

- [ ] **Step 1:** Add the PWA config and the workflow. Run `pnpm build`. Expected: the build emits `manifest.webmanifest` and a service worker.
- [ ] **Step 2:** `pnpm preview`, open it in the built-in browser and play a full day: Home → the design-flow lesson → caching → the sandbox (spike fails, add cache + replica, all green) → two pointers (wrong code fails, then `while True: pass` → the timeout message, then the correct code passes and the walkthrough plays) → bug hunt → extras. Expected: the streak is 1, readiness bars move, review items are scheduled, and everything survives a reload.
- [ ] **Step 3:** In `pnpm dev`, fake tomorrow with `?today=YYYY-MM-DD` (Task 4) and confirm that missed items appear in Review and the streak is 2 after one answer.
- [ ] **Step 4:** Check 375 px width and dark mode; export the progress file, clear storage, import it, and confirm the progress is back.
- [ ] **Step 5:** `pnpm test` all green. Commit `chore: PWA and Pages deploy`. Pushing and creating the GitHub repo happen only when the owner asks.
