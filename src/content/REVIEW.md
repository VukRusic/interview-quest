# Content review checklist (Unit 1)

The owner reviews every item for technical correctness before relying on it. Tick an item when its
prompt, options, answer, explanation and fix are all correct. Wrong content is a failure even if the
app works.

Sandbox numbers are illustrative (see `src/content/scenarios.ts`); check that the *lesson* they teach
is right, not the exact figures.

## design-flow (lesson, design)
- [ ] explain: "Five steps, every time" (+ DesignFlow visual time budgets)
- [ ] `df-first-move`
- [ ] `df-estimates`
- [ ] `df-time`
- [ ] `df-tradeoffs`

## caching (lesson, design)
- [ ] explain: "Cache-aside in one picture" (+ CacheFlow visual)
- [ ] explain: "Where it bites in production"
- [ ] `cache-aside-who`
- [ ] `cache-invalidate`
- [ ] `cache-ttl`
- [ ] `cache-stampede-name`
- [ ] `cache-stampede-fix`

## slow-product-page (practice, design)
- [ ] explain: "Read replicas"
- [ ] `sandbox-slow-product-page` (scenario story, SLO, budget, lesson text)

## two-pointers (lesson, algo)
- [ ] explain: "Why moving inward works" (+ TwoPointers visual)
- [ ] `tp-which-sorted`
- [ ] `tp-which-palindrome`
- [ ] `tp-which-unsorted`
- [ ] `py-pair-with-sum` (prompt, 7 tests, reference, 11 walkthrough frames)

## bug-hunt-1 (practice, review)
- [ ] explain: "Read code like a reviewer"
- [ ] `bug-async-void` (C#)
- [ ] `bug-ef-n-plus-one` (C#)
- [ ] `bug-stale-closure` (TypeScript/React)
- [ ] `bug-angular-subscribe` (TypeScript/Angular)
- [ ] `bug-sql-fstring` (Python)

## sql-indexes (extra, stack)
- [ ] explain: "How an index gets used"
- [ ] `sql-composite-order`
- [ ] `sql-function-on-column`
- [ ] `sql-covering`
- [ ] `sql-index-cost`

## mock-url-shortener (extra, design)
- [ ] `mock-url` (prompt, 4 follow-ups, 6 rubric items)

## story-built-system (extra, stories)
- [ ] `story-proud-system` (prompt and hints only; the owner's answers live in the browser, never here)

# Unit 2: Traffic and failure

Same rules as Unit 1. Visuals use illustrative numbers; check that what they *teach* is right.

## load-balancing (lesson, design)
- [ ] explain: "One server is one point of failure" (+ LoadBalancer visual)
- [ ] explain: "What makes it work" (stateless servers, round robin vs least connections, layer 4 vs 7)
- [ ] `lb-health-check`
- [ ] `lb-session-state`
- [ ] `lb-least-connections`
- [ ] `lb-l4-l7`
- [ ] `lb-spof`

## queues (lesson, design)
- [ ] explain: "Don’t make the user wait for slow work" (+ QueueBuffer visual)
- [ ] explain: "What a queue asks of you in return"
- [ ] `q-good-fit`
- [ ] `q-backlog`
- [ ] `q-duplicates`
- [ ] `q-dead-letter`
- [ ] `q-accepted`

## retries-idempotency (lesson, design)
- [ ] explain: "When something you depend on is slow" (+ RetryStorm visual; the three load curves are made up to show the shape)
- [ ] explain: "Retrying safely" (idempotency key, circuit breaker states)
- [ ] `res-no-timeout`
- [ ] `res-jitter`
- [ ] `res-timeout-unknown`
- [ ] `res-idempotency-key`
- [ ] `res-breaker-open`
- [ ] `bug-retry-charge` (C#: check the claim that EnsureSuccessStatusCode throws HttpRequestException on 4xx/5xx)
- [ ] `bug-fetch-no-timeout` (TypeScript: check AbortSignal.timeout usage)
