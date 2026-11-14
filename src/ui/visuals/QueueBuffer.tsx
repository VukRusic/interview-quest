import { useState } from 'react';

const WORKER_RATE = 8;
const BURST_SECONDS = 5;

/** A five-second burst of orders against a worker that handles 8 a second, with and without a queue. */
export function QueueBuffer() {
  const [rate, setRate] = useState(8);
  const [queueOn, setQueueOn] = useState(true);
  const extra = Math.max(0, rate - WORKER_RATE) * BURST_SECONDS;
  const waiting = queueOn ? extra : 0;
  const lost = queueOn ? 0 : extra;
  const drain = waiting / WORKER_RATE;

  return (
    <div className="viz viz-queue">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={queueOn} onChange={(e) => setQueueOn(e.target.checked)} />
          <span>Queue in front of the worker</span>
        </label>
      </div>
      <label className="viz-slider">
        <span>
          Orders arriving: <strong>{rate} a second</strong> for {BURST_SECONDS} seconds
        </span>
        <input
          type="range"
          min={0}
          max={20}
          value={rate}
          aria-label="Orders arriving per second"
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </label>
      <div className="queue-bar" aria-hidden="true">
        <span className="queue-fill" style={{ width: `${Math.min(100, (waiting / 60) * 100)}%` }} />
        <span className="queue-lost" style={{ width: `${Math.min(100, (lost / 60) * 100)}%` }} />
      </div>
      <dl className="viz-stats">
        <div>
          <dt>Worker handles</dt>
          <dd>{WORKER_RATE} a second</dd>
        </div>
        <div>
          <dt>Waiting in the queue</dt>
          <dd>{waiting}</dd>
        </div>
        <div>
          <dt>Orders lost</dt>
          <dd>{lost}</dd>
        </div>
      </dl>
      <p className="viz-legend">
        {waiting > 0
          ? `After the burst the worker needs about ${drain.toFixed(1)} more seconds to clear the backlog. Nobody lost an order; some were confirmed a little later.`
          : lost > 0
            ? 'With nowhere to wait, every order beyond what the worker can take is rejected.'
            : 'The worker keeps up, so nothing waits.'}{' '}
        Illustrative numbers.
      </p>
    </div>
  );
}
