import { useState } from 'react';

const NUMS = [2, 1, 5, 1, 3, 2];
const K = 3;

type Frame = { start: number; sum: number; best: number; note: string };

function frames(): Frame[] {
  let sum = NUMS.slice(0, K).reduce((a, b) => a + b, 0);
  let best = sum;
  const out: Frame[] = [{ start: 0, sum, best, note: `Add up the first ${K} numbers once: ${NUMS.slice(0, K).join(' + ')} = ${sum}.` }];
  for (let i = K; i < NUMS.length; i++) {
    const before = sum;
    sum += NUMS[i] - NUMS[i - K];
    best = Math.max(best, sum);
    out.push({
      start: i - K + 1,
      sum,
      best,
      note: `Slide one step: add ${NUMS[i]}, subtract ${NUMS[i - K]}. ${before} + ${NUMS[i]} − ${NUMS[i - K]} = ${sum}.`,
    });
  }
  return out;
}

const FRAMES = frames();

/** Largest sum of 3 neighbours: each step adds the number entering the window and subtracts the one leaving. */
export function SlidingWindow() {
  const [i, setI] = useState(0);
  const f = FRAMES[i];
  const inWindow = (k: number) => k >= f.start && k < f.start + K;
  return (
    <div className="viz viz-window">
      <p className="viz-caption">
        Largest sum of {K} neighbours. Step {i + 1} of {FRAMES.length}.
      </p>
      <ol className="cells" aria-label="Numbers">
        {NUMS.map((n, k) => (
          <li key={k} className={`cell ${inWindow(k) ? 'is-on' : ''} ${k < f.start ? 'is-out' : ''}`}>
            <span className="cell-val">{n}</span>
            <span className="cell-tag">{k === f.start + K - 1 && i > 0 ? 'in' : k === f.start - 1 ? 'out' : ''}</span>
          </li>
        ))}
      </ol>
      <dl className="viz-stats">
        <div>
          <dt>Window sum</dt>
          <dd data-testid="window-sum">{f.sum}</dd>
        </div>
        <div>
          <dt>Best so far</dt>
          <dd data-testid="window-best">{f.best}</dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {f.note}
      </p>
      <div className="viz-controls">
        <button type="button" className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          Back
        </button>
        <button type="button" className="btn" disabled={i === FRAMES.length - 1} onClick={() => setI(i + 1)}>
          Next step
        </button>
      </div>
    </div>
  );
}
