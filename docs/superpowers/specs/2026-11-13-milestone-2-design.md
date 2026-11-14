# Interview Quest, Milestone 2: more content, paced

> Design doc from brainstorming (2026-11-13). Builds on `2026-11-10-interview-quest-design.md`, which stays binding except where this doc says it amends it. Next step: implementation plan in `docs/superpowers/plans/`.

## Intent and the why
The owner played Unit 1 on their phone and went through seven of its eight lessons in one sitting. After that the daily session was a few minutes of review. Milestone 2 adds two units so there is new material every day, and shapes that material around what the owner said after playing:

- Mock interviews "look really good": more of them, sooner.
- Bug hunts were "the least useful": far fewer.
- They want quiz questions that range wider, over "all the tech talk stuff which would come up during a talk with interviewers", so they can look things up afterwards.
- Less Angular. Add AI topics: Claude, token usage, and writing a prompt inside a token budget (they heard of an interview that asked for a prompt under 10,000 tokens).
- One or two new lessons a day is the right pace, "because later I like to make myself read about that stuff I encountered in app".
- The progress bars confused them: 0% everywhere after a full day of work.

## Goals
- **Units 2 and 3**, about 10 lessons each, following the original spec's order of fundamentals. At one or two lessons a day that is 10–20 days of new material.
- **A mock interview in every unit**, on a system that uses what the unit taught.
- **A tech talk thread:** multiple-choice cards on technologies, patterns and terms that come up as follow-ups. Each card gives a short correct explanation and a phrase to look up.
- **An AI thread:** how models like Claude are used in practice (tokens, context windows, cost, caching, retrieval, tool use, checking outputs), and one exercise writing a prompt inside a token budget.
- **A daily limit of two new lessons**, with the rest held until tomorrow.
- **Progress bars that show work done on day one** and can reach 100% for every topic.
- Each unit goes live on its own as soon as it is finished and reviewed.

## Non-goals
- No runtime AI, no paid services, no backend, no accounts (unchanged). The app does not run the owner's prompt or count tokens exactly.
- No new bug-hunt lessons.
- No Angular-specific lessons. The stack layer in these units is .NET async and API/gateway design.
- The Library stays on hold.
- Units 4 and later (whole-design scenarios, mock-heavy stage) are a later milestone.

## Anti-goals
- Tech talk that turns into trivia: memorising version numbers, flags or framework details. A card belongs only if an interviewer could plausibly raise the term in a design or experience conversation.
- AI content that goes stale: prices, model names, context sizes in numbers that change yearly.
- A daily limit that feels like punishment. No timers, no countdown, nothing lost.
- Wrong technical content (unchanged, and the main risk as volume grows).
- Progress that lies (unchanged). The new "practised" fill must not be readable as proven knowledge.

## Constraints
- Same stack and repo. Content stays as typed data files validated by zod at test time.
- Deploys on push to `main`. Ask the owner before each push.
- The owner's saved progress on their phone must keep working: no change to the meaning of existing fields in `iq.progress.v1`, and existing item and lesson ids stay as they are.
- The owner reviews content for correctness. Each unit adds its own section to `src/content/REVIEW.md`.

## Approaches considered
- **A. Mixed units, shipped one at a time. Chosen by the owner.** Each unit mixes design fundamentals, a sandbox scenario, a mock interview, tech talk decks, a Python pattern, an AI lesson and a story prompt. Mocks stay tied to what was just taught; Unit 2 reaches the phone soonest; review comes in two batches.
- **B. Tech talk and mocks first.** A deck of about 100 cards and several mocks, no sandbox work. Fastest, but mocks on untaught topics become guesswork and the "aha" lessons are dropped. Rejected.
- **C. One long unit.** Same work as A, but nothing ships until all of it is done and review lands in one block. Rejected.

## Decided parts of the how

### Decided by the owner
- Approach A, Units 2 and 3.
- Tech talk cards are multiple choice ("pick the right description"), with no typing.
- One or two new lessons a day.
- More mock interviews, fewer bug hunts, less Angular, AI topics including the token-budget prompt.

### My calls (the owner has seen the first four in conversation; the rest are new here)
1. **Daily limit is two, fixed.** A lesson counts toward today when its first completion date is today (`completed[id] === today`; the reducer already keeps the first date). Once two are done, every not-yet-completed lesson on the trail shows "Tomorrow" and does not open. Reviews, re-solves and replaying finished lessons are never limited. There is no override in the UI; the limit is one named constant. The limit also holds when a held lesson is opened by its address, which shows the same "Tomorrow" message instead of the lesson.
2. **Home offers the next lessons in trail order**, up to what is left of today's two, whatever their slot. This replaces the lesson/practice/extras split in `buildSession`. The `slot` field stays in the schema as a label only. Lessons finished today stay visible as done so the session is stable for the day.
3. **Progress bars: a lighter "practised" fill behind the proven fill.** Practised = share of the topic's items answered or self-graded at least once. The percentage keeps meaning proven. The status text says both ("4 of 5 practised").
4. **Bars measure against what a topic can earn.** Readiness = earned ÷ maximum earnable, where a self-graded item's maximum is 0.5. Self-graded work still counts half next to auto-checked work in a mixed topic, but a story-only topic reaches 100% at a top self-grade. *Amends the original spec's readiness rule; the half weight is kept.*
5. **Tech talk is a new pillar, `talk`, labelled "Tech talk".** A deck is an ordinary lesson: one short explain step, then 8–10 quiz steps. No new step kind. `QuizStep` gains an optional `lookUp` string, shown after answering as "Look up: …". It is a search phrase, never a URL, because links rot.
6. **AI is a new pillar, `ai`, labelled "Working with AI".**
7. **New step kind `prompt`** for the token-budget exercise: a task brief, a token budget, a text box with a live token estimate and a clear over-budget state, then a rubric to self-grade against. It is a self-graded kind (half weight, like mock and story), saves the draft like mock answers do, and offers the existing copy-for-review button.
8. **Token estimate is characters ÷ 4, labelled "about".** Exact counts need the model provider's tokenizer, which is not available offline or free of an API key. The lesson says so, since knowing that estimates differ from real counts is part of the skill.
9. **Bug cards live inside the lesson they relate to** (two or three per unit), for example a retry without an idempotency key in the retries lesson. They enter the review queue as before. C#, TypeScript or Python; no Angular.
10. **Unit contents** (order within a unit is the builder's to adjust):

    **Unit 2: Traffic and failure**
    1. Load balancing (design)
    2. Queues and background work (design)
    3. Timeouts, retries and idempotency (design, with bug cards)
    4. Sandbox: the flash sale (load balancer, app servers and a queue; a spike and a server failure)
    5. Tech talk: the path of a request (DNS, CDN, TLS, reverse proxy, API gateway, REST vs gRPC, WebSockets vs server-sent events)
    6. Sliding window (Python)
    7. Tech talk: messaging and reliability (log vs queue brokers, delivery guarantees, dead-letter queues, backpressure, circuit breakers, rate-limiting algorithms)
    8. AI: tokens and context windows
    9. Mock interview: a notification system
    10. Story: a time something broke in production

    **Unit 3: Data at scale**
    1. SQL vs NoSQL (design)
    2. Replication (design)
    3. Sharding and partitioning (design)
    4. Consistency: what "eventual" costs you (design, with bug cards)
    5. Sandbox: a data scenario built on replicas and write smoothing
    6. Tech talk: data stores (key-value, document, search, object storage, column and time-series stores, vector search)
    7. A hash-map or binary-search pattern (Python)
    8. .NET async/await: what the compiler does (stack)
    9. AI: writing a prompt inside a token budget (uses the `prompt` step)
    10. Mock interview: a news feed
    11. Story: a trade-off you argued for

11. **Two deliveries.** 2a: the app changes in calls 1–6 plus Unit 2. 2b: the `prompt` step plus Unit 3. Each is merged and pushed when its tests pass, it has been played through in the browser, and the owner says go.

## Left to the builder
- Exact lesson text, quiz wording, visuals for each concept (every concept lesson keeps a visual or interactive explanation before its exercises, as the original spec requires).
- Sandbox changes. The engine already has load balancer and queue components. It has no way to model an app server failing, and no shard. Add what the two scenarios need, with tests; a shard component is optional if the Unit 3 scenario works without one.
- Topic ids and how tech talk cards are grouped into topics (each deck should map to one or two bars, not one bar per card).
- The look of the "Tomorrow" state, the practised fill and the `prompt` step, in the existing pixel-medieval style.
- Sources for AI content. Check facts against current Anthropic documentation while writing; keep to concepts that hold across models.
- Whether the day-one Home screen needs a one-line explanation of the two fills.

## Verification (for the plan)
- `pnpm test` passes, including new tests for: the daily limit (two first completions close the trail, replay and review stay open, the next day reopens), readiness against maximum earnable, the practised share, content validation for both units (unique ids across all units), any sandbox engine changes, and the token estimate.
- A test loads the owner's exported progress file shape from Milestone 1 and shows nothing is lost and no bar drops.
- In the built-in browser at phone width, light and dark: complete two Unit 2 lessons and see the trail close until tomorrow; use `?today=` to move a day on and see it reopen; answer a tech talk deck and see "Look up"; solve the flash-sale sandbox; finish the mock interview; for 2b, write a prompt over and under budget.
- Each unit's `REVIEW.md` section exists before that unit is pushed.
