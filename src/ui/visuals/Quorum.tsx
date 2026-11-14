import { useState } from 'react';

const N = 3;

/** Three replicas: how many a write waits for (W) and how many a read asks (R). */
export function Quorum() {
  const [w, setW] = useState(2);
  const [r, setR] = useState(2);
  const safe = r + w > N;
  const slider = (label: string, value: number, set: (n: number) => void) => (
    <label className="viz-slider">
      <span>
        {label}: <strong>{value}</strong> of {N}
      </span>
      <input type="range" min={1} max={N} value={value} aria-label={label} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  return (
    <div className="viz viz-quorum">
      {slider('Writes wait for', w, setW)}
      {slider('Reads ask', r, setR)}
      <p className={`viz-note quorum-verdict ${safe ? 'is-right' : 'is-wrong'}`} data-testid="quorum-verdict" aria-live="polite">
        <strong>
          {r} + {w} {safe ? '>' : '≤'} {N}.
        </strong>{' '}
        {safe
          ? 'Any replicas a read asks must include at least one that took the latest write, so the read is guaranteed to see it.'
          : 'A read can land only on replicas that missed the latest write, so the answer may be stale.'}
      </p>
      <dl className="viz-stats">
        <div>
          <dt>Writes survive</dt>
          <dd>{N - w} down</dd>
        </div>
        <div>
          <dt>Reads survive</dt>
          <dd>{N - r} down</dd>
        </div>
      </dl>
      <p className="viz-legend">Higher numbers are safer and slower, and stop working sooner when replicas are down.</p>
    </div>
  );
}
