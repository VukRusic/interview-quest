import { useState } from 'react';

const NUMS = [1, 3, 4, 6, 8, 11];
const TARGET = 10;

type Frame = { l: number; r: number; note: string; found?: boolean };

function frames(): Frame[] {
  const out: Frame[] = [];
  let l = 0;
  let r = NUMS.length - 1;
  while (l < r) {
    const sum = NUMS[l] + NUMS[r];
    if (sum === TARGET) {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${sum}. Found it.`, found: true });
      return out;
    }
    if (sum > TARGET) {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${sum}, too big. Every pair with ${NUMS[r]} is too big, so move right in.` });
      r--;
    } else {
      out.push({ l, r, note: `${NUMS[l]} + ${NUMS[r]} = ${sum}, too small. Every pair with ${NUMS[l]} is too small, so move left in.` });
      l++;
    }
  }
  return out;
}

const FRAMES = frames();

/** Pair with sum 10 in a sorted list: each step rules out a whole row of pairs. */
export function TwoPointers() {
  const [i, setI] = useState(0);
  const f = FRAMES[i];
  return (
    <div className="viz viz-pointers">
      <p className="viz-caption">
        Sorted list, target {TARGET}. Step {i + 1} of {FRAMES.length}.
      </p>
      <ol className="cells" aria-label="Sorted numbers">
        {NUMS.map((n, k) => (
          <li
            key={k}
            className={`cell ${k === f.l || k === f.r ? 'is-on' : ''} ${f.found && (k === f.l || k === f.r) ? 'is-found' : ''} ${k < f.l || k > f.r ? 'is-out' : ''}`}
          >
            <span className="cell-val">{n}</span>
            <span className="cell-tag">{k === f.l ? 'left' : k === f.r ? 'right' : ''}</span>
          </li>
        ))}
      </ol>
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
