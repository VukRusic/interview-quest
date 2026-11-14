import { useState } from 'react';

type Strategy = 'immediate' | 'fixed' | 'jitter';

/** Requests per second reaching a dependency that is down during seconds 3 to 5. Normal load is 100. */
const LOAD: Record<Strategy, number[]> = {
  immediate: [100, 100, 600, 600, 600, 100, 100, 100],
  fixed: [100, 100, 100, 200, 300, 300, 100, 100],
  jitter: [100, 100, 100, 140, 150, 150, 130, 100],
};
const LABEL: Record<Strategy, string> = {
  immediate: 'Retry immediately, up to 5 times',
  fixed: 'Wait 1 second, then retry',
  jitter: 'Back off (1 s, 2 s, 4 s) with jitter',
};
const NOTE: Record<Strategy, string> = {
  immediate: 'Every failed call is repeated at once, so the dependency gets six times its normal load exactly when it is struggling.',
  fixed: 'Everyone who failed together retries together, one second later. The retries stack up in waves and hit again just as it recovers.',
  jitter: 'Each client waits longer after each failure and adds a random amount, so retries spread out and the peak stays close to normal.',
};
const DOWN = [2, 3, 4];
const MAX = 600;

export function RetryStorm() {
  const [strategy, setStrategy] = useState<Strategy>('immediate');
  const load = LOAD[strategy];
  return (
    <div className="viz viz-retry">
      <div className="retry-options" role="radiogroup" aria-label="Retry strategy">
        {(Object.keys(LABEL) as Strategy[]).map((s) => (
          <label key={s} className="switch">
            <input type="radio" name="retry-strategy" checked={strategy === s} onChange={() => setStrategy(s)} />
            <span>{LABEL[s]}</span>
          </label>
        ))}
      </div>
      <ol className="retry-chart" aria-label="Requests per second over eight seconds">
        {load.map((v, i) => (
          <li key={i} className={DOWN.includes(i) ? 'is-down' : ''} title={`second ${i + 1}: ${v} requests`}>
            <span className="retry-bar" style={{ height: `${(v / MAX) * 100}%` }} />
            <span className="retry-tick">{i + 1}s</span>
          </li>
        ))}
      </ol>
      <dl className="viz-stats">
        <div>
          <dt>Normal load</dt>
          <dd>100</dd>
        </div>
        <div>
          <dt>Peak requests per second</dt>
          <dd>{Math.max(...load)}</dd>
        </div>
      </dl>
      <p className="viz-legend">
        {NOTE[strategy]} The shaded seconds are the outage. Illustrative numbers.
      </p>
    </div>
  );
}
