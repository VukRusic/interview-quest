import { useState } from 'react';

const NUMS = [8, 3, 11, 7, 2];
const TARGET = 9;

type Frame = { i: number; need: number; seen: number[]; found: number | null; note: string };

function frames(): Frame[] {
  const out: Frame[] = [];
  const seen = new Map<number, number>();
  for (let i = 0; i < NUMS.length; i++) {
    const n = NUMS[i];
    const need = TARGET - n;
    const at = seen.get(need);
    if (at !== undefined) {
      out.push({ i, need, seen: [...seen.keys()], found: at, note: `${n} needs ${need}, and ${need} was seen at position ${at}. The pair is at positions ${at} and ${i}.` });
      return out;
    }
    out.push({ i, need, seen: [...seen.keys()], found: null, note: `${n} needs ${need} to reach ${TARGET}. ${seen.size ? `${need} has not been seen` : 'Nothing has been seen yet'}, so remember ${n} and move on.` });
    seen.set(n, i);
  }
  return out;
}

const FRAMES = frames();

/** Two numbers adding to 9 in an unsorted list: one pass, remembering what has been seen. */
export function HashLookup() {
  const [k, setK] = useState(0);
  const f = FRAMES[k];
  return (
    <div className="viz viz-hash">
      <p className="viz-caption">
        Unsorted list, target {TARGET}. Step {k + 1} of {FRAMES.length}.
      </p>
      <ol className="cells" aria-label="Numbers">
        {NUMS.map((n, idx) => (
          <li key={idx} className={`cell ${idx === f.i ? 'is-on' : ''} ${f.found === idx || (f.found !== null && idx === f.i) ? 'is-found' : ''}`}>
            <span className="cell-val">{n}</span>
            <span className="cell-tag">{idx === f.i ? 'now' : idx < f.i ? 'seen' : ''}</span>
          </li>
        ))}
      </ol>
      <dl className="viz-stats">
        <div>
          <dt>Looking for</dt>
          <dd data-testid="hash-need">{f.need}</dd>
        </div>
        <div>
          <dt>Seen so far</dt>
          <dd data-testid="hash-seen" className="stat-text">
            {f.seen.length ? f.seen.join(', ') : 'nothing'}
          </dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {f.note}
      </p>
      <div className="viz-controls">
        <button type="button" className="btn" disabled={k === 0} onClick={() => setK(k - 1)}>
          Back
        </button>
        <button type="button" className="btn" disabled={k === FRAMES.length - 1} onClick={() => setK(k + 1)}>
          Next step
        </button>
      </div>
    </div>
  );
}
