# Interview Quest

A calm, Duolingo-style daily path for interview prep, with a light pixel-art quest look: system design
(with a chaos sandbox), code-review bug cards (C#, TypeScript, Python), Python algorithm patterns with
step-through walkthroughs, a light stack layer, scripted mock interviews and private STAR stories.

No backend, no accounts, no paid services. Python runs in your browser (Pyodide from jsDelivr).

## Run

```bash
pnpm install
pnpm dev       # http://localhost:5173/interview-quest/
pnpm test      # logic and UI tests (Vitest)
pnpm build     # production build in dist/ (PWA: manifest + service worker)
pnpm preview   # serve the build at http://localhost:4173/interview-quest/
```

In dev builds only, add `?today=YYYY-MM-DD` to the URL to pretend it is another day (useful for
testing reviews and streaks), e.g. `http://localhost:5173/interview-quest/?today=2026-11-11#/`.

## Your progress lives in your browser

Progress, streak, review schedule, mock answers and your stories are stored in this browser's
`localStorage` only. Nothing is uploaded. To move to another device or keep a backup, use
**Settings → Export progress**, then **Import progress** on the other device. The export file contains
your private stories, so keep it somewhere private. Stories are never committed to this repo.

## Deploy (GitHub Pages, free)

`.github/workflows/deploy.yml` tests, builds and deploys `dist/` on every push to `main`. One-time
setup after creating the GitHub repo named `interview-quest`: **Settings → Pages → Source: GitHub
Actions**. The app is served at `https://<user>.github.io/interview-quest/` (the `base` in
`vite.config.ts` must match the repo name).

## Content

Units live in `src/content/` as typed data validated with zod. `src/content/REVIEW.md` is the owner's
correctness checklist. Sandbox numbers are illustrative, not benchmarks. Regenerate the icons with
`python3 scripts/make-icons.py`.
