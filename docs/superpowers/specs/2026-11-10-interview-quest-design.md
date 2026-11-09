# Interview Quest: design

> Design doc from brainstorming (2026-11-10). Next step: implementation plan in `docs/superpowers/plans/`.

## Intent and the why
The owner is a software developer with 5 years of experience (.NET, SQL, Angular, Ionic/Capacitor, Vue, other JS frameworks, API gateways). They have been at the same company for a while and want to get back into interview prep for a job search **1–3 months out**. Targets: **product companies and startups, remote roles at US/EU firms, local companies and agencies.** Not big tech.

LeetCode didn't hold their interest. They like **Duolingo's rhythm: show up every day for 30–60 minutes and follow a guided path** without deciding what to study. Fun for them means **visible progress** and **"aha" moments** (seeing why something works). It does not mean pressure, timers or grinding.

Research on 2025–26 interviews for this level and these targets: system design is a core round (run as a working session, five-step flow). Practical coding and code review are replacing take-homes and part of LeetCode. Some rounds are AI-assisted and grade reading and validating code. Algorithms are still asked in screens, at easy/medium level. Behavioural questions appear in nearly every loop. Local companies often ask stack questions.

## Goals
- A guided daily path (30–60 min) across four pillars, weighted for the targets:
  1. **System design (largest):** the five-step answer flow (requirements → estimates → high-level → deep dive → trade-offs) and building blocks (caching, load balancing, queues, databases incl. SQL vs NoSQL, replication, sharding, consistency, failure handling).
  2. **Practical coding & code review:** mainly **small question cards**: a 5–15 line snippet with a modern bug or bad practice. Tap the line or pick the issue, then see why it bites in production and the fix. Themes: async pitfalls (`async void`, `.Result` deadlocks, forgotten `await`, unhandled rejections), data (N+1 in EF Core, SQL injection, missing index, float money), front end (unsubscribed Angular observables, stale `useEffect` closures, state mutation), APIs (no validation, leaked errors, no idempotency, timezone bugs), security (secrets in code, broad CORS, unvalidated JWT), and AI-generated code smells (made-up APIs, happy-path only, hidden O(n²)). Cards go into the review queue. Occasionally a **mini PR** (30–50 lines, 2–3 issues) appears as the practice step.
  3. **Algorithm patterns (lighter):** easy/medium pattern recognition and solving in **Python**, with step-through visual explanations.
  4. **Experience stories:** turn the owner's real work into behavioural answers (STAR).
  - Plus a **light stack layer:** a small set of common deep questions (SQL indexing and query plans, .NET async/await, Angular change detection, REST/API and gateway design). No trivia.
- **Visible, honest progress:** readiness per topic fills only from correct answers that still hold on later review. Streak, daily goal, unit checkpoints.
- **Aha-first teaching:** every concept has a visual or interactive explanation before the exercises.
- **Chaos sandbox:** build an architecture, send traffic and failures through it, and see why it breaks and why a fix works.
- **Scripted mock interviews:** a design prompt, your typed answer, revealed follow-ups, then self-grading against a rubric.
- Playable early: the first unit within days. More units are added as content over the 1–3 months.

## Non-goals
- No paid services or runtime AI (free only for now). The interviewer's question/answer interface is kept swappable so AI can be added later.
- No accounts, no backend, no multi-user.
- No big-tech-level hard algorithm grind, no huge problem list.
- No stack trivia quizzes.

## Anti-goals (failure even if it works)
- Feels like LeetCode: a list of problems with no path and no "why."
- Pressure mechanics as the core (timers, losing lives).
- Progress that lies: bars filling from time spent rather than proven recall.
- Wrong technical content. Every explanation must be correct; the owner reviews content.

## Constraints
- Free to build and run. Hosted free (GitHub Pages or Vercel).
- A new separate repo, outside AwayAI: `~/Developer/interview-quest` *(my call on name and location)*.
- Mainly used on a laptop (coding, sandbox). Installable on the phone (PWA) for warm-up reviews and lessons.
- Algorithm solutions are written and run in Python.
- Content is written by Claude during development as data files and reviewed by the owner. There's no runtime generation.

## Approaches considered
- **A. React web app (PWA)**, React + Vite + TypeScript, Python in the browser via Pyodide, sandbox with React Flow. **Chosen.** Best fit for Python and a visual canvas on a laptop, free, still installable on the phone.
- **B. Expo / React Native:** the most native phone feel and the stack known from AwayAI, but running Python, the code editor and the canvas sandbox are all awkward on native. Rejected.
- **C. Single HTML file:** the fastest to try, but outgrown within weeks. Rejected.

## Decided parts of the how
- **Structure:** a Duolingo-style **linear path of units** mixing the pillars. A skill-tree/readiness map shows progress but isn't the main menu.
- **Daily session:** (1) warm-up review of spaced-repetition items (~5 min), (2) a new lesson: concept + visual + exercises (~10–15 min), (3) practice: a sandbox scenario, a code review, or an algorithm problem (~10–20 min), (4) optional extra: a mock-interview script, a story or a stack question.
- **Progression across 1–3 months:** fundamentals (design flow, caching, databases, main patterns) → whole-design scenarios → mock interviews.
- **Spaced repetition (Leitner):** intervals of 1 → 3 → 7 → 14 → 30 days. A correct answer moves an item up a box; a miss sends it back to box 1. An item counts as **learned** once it passes the 14-day review. The review queue holds quick checks, pattern recognition and short code-review snippets; full problems come back as an occasional "re-solve." *(my call)*
- **Readiness:** auto-checked work (quizzes, Python tests, sandbox outcomes, code-review answers) counts fully. Rubric self-grades (mock interviews, design answers, stories) count **at lower weight** (e.g. half). *(Weighting: owner's choice; exact factor: my call.)*
- **Code-review / spot-the-bug language:** a mix, mostly C# and TypeScript (the owner's stack, tying into the stack layer) plus some Python. Algorithm solving stays Python-only.
- **Experience stories stay private:** written by the owner in an in-app editor with STAR prompts, saved only in browser storage and the export file, **never in the repo** (which is public once hosted). The repo only ships the prompts and example structure.
- **Progress stored locally** in the browser, with export/import of a JSON file to move between devices.
- **Python execution:** Pyodide in a web worker. Each problem has hidden test cases; the walkthrough steps through a reference solution visually.

## Left to the builder
- Libraries beyond React/Vite/Pyodide/React Flow (editor, state, styling, routing), and the exact visual design. Use the frontend-design skill; it should feel calm and encouraging, not gamer-flashy.
- The content data format (JSON/MDX), the sandbox simulation model (simple capacity/latency math is enough), and the exact unit order within the progression above.
- Size of the first content batch: enough for unit 1 to be playable end to end across all pillars. More units later.
- Tests: Vitest for the logic (spaced repetition, progress/readiness, the sandbox simulation, answer checking).

## Verification (for the eventual plan)
- `pnpm test` passes for the logic.
- Run locally and, in the built-in browser, complete a full daily session for unit 1: the review queue, a lesson, a Python problem passing its tests, a sandbox scenario reacting to a chaos event, a code review exercise. Progress, streak and readiness update and survive a reload.
- Check at phone width and in dark mode; check that it installs as a PWA.
